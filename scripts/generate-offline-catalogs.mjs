import { createHash } from "node:crypto";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const outputDirectory = path.join(
  process.cwd(),
  "public",
  "offline",
  "catalogs",
);
const dataDirectory = path.join(outputDirectory, "data");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to generate offline catalogs");
}

const sql = postgres(databaseUrl, { max: 1 });
const generatedAt = new Date().toISOString();

function serialize(value) {
  return JSON.stringify(value);
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function compactId(value) {
  if (value === null) return null;
  const hex = value.replaceAll("-", "");
  return /^[a-f0-9]{32}$/i.test(hex)
    ? `~${Buffer.from(hex, "hex").toString("base64url")}`
    : value;
}

async function writeCatalog(name, value) {
  const body = serialize(value);
  const sha256 = hash(body);
  const filename = `${name}.${sha256.slice(0, 12)}.json`;
  await writeFile(path.join(dataDirectory, filename), body);
  return {
    version: sha256.slice(0, 12),
    sha256,
    bytes: Buffer.byteLength(body),
    url: `/offline/catalogs/data/${filename}`,
    updatedAt: generatedAt,
  };
}

async function generateQuestionCatalog(license) {
  const categoryRows = await sql`
    select
      c.id,
      c.name,
      c.url,
      c.color,
      c.icon,
      c.description,
      c.topics,
      c."examTime",
      c."examQuestionCount"
    from "nauka-ppla_category" c
    where c."licenseId" = ${license.id}
    order by c.id
  `;

  const instanceRows = await sql`
    select
      qi.id as "instanceId",
      qi."categoryId",
      q.id as "questionId",
      q."externalId",
      q.question,
      q."answerCorrect",
      q."answerIncorrect1",
      q."answerIncorrect2",
      q."answerIncorrect3",
      exists(
        select 1
        from "nauka-ppla_question_to_explanation" qte
        where qte."questionId" = q.id
      ) as "hasExplanation",
      coalesce((
        select json_agg(distinct kb."knowledgeBaseNodeId")
        from "nauka-ppla_question_to_explanation" qte
        inner join "nauka-ppla_kb_node_to_explanation" kb
          on kb."explanationId" = qte."explanationId"
        where qte."questionId" = q.id
      ), '[]'::json) as "knowledgeBaseNodeIds"
    from "nauka-ppla_question_instance" qi
    inner join "nauka-ppla_question" q on q.id = qi."questionId"
    inner join "nauka-ppla_category" c on c.id = qi."categoryId"
    where c."licenseId" = ${license.id}
    order by qi.id
  `;

  const questions = [];
  const questionIndex = new Map();
  const instances = [];

  for (const row of instanceRows) {
    let index = questionIndex.get(row.questionId);
    if (index === undefined) {
      index = questions.length;
      questionIndex.set(row.questionId, index);
      questions.push([
        compactId(row.questionId),
        row.externalId,
        row.question,
        row.answerCorrect,
        row.answerIncorrect1,
        row.answerIncorrect2,
        row.answerIncorrect3,
        row.hasExplanation,
        row.knowledgeBaseNodeIds.map(compactId),
      ]);
    }
    instances.push([compactId(row.instanceId), index, row.categoryId]);
  }

  return {
    v: 1,
    l: [license.id, license.url, license.name, license.version],
    c: categoryRows.map((category) => [
      category.id,
      category.name,
      category.url,
      category.color,
      category.icon,
      category.description,
      category.topics,
      category.examTime,
      category.examQuestionCount,
    ]),
    q: questions,
    i: instances,
  };
}

async function generateKnowledgeBaseCatalog() {
  const [nodes, nodeExplanationRows, questionExplanationRows, countRows] =
    await Promise.all([
      sql`
        select id, name, slug, type, "parentId", "order", "createdAt"
        from "nauka-ppla_knowledge_base_node"
        order by "parentId" nulls first, "order"
      `,
      sql`
        select
          link."knowledgeBaseNodeId" as "nodeId",
          link."order",
          e.id as "explanationId",
          e.type,
          e.explanation
        from "nauka-ppla_kb_node_to_explanation" link
        inner join "nauka-ppla_explanation" e on e.id = link."explanationId"
        order by link."knowledgeBaseNodeId", link."order"
      `,
      sql`
        select
          qte.id,
          qte."questionId",
          qte."explanationId",
          qte."order",
          qte."isExtraResource"
        from "nauka-ppla_question_to_explanation" qte
        order by qte."questionId", qte."isExtraResource", qte."order"
      `,
      sql`
        select
          kb."knowledgeBaseNodeId" as "nodeId",
          l.url as "licenseUrl",
          count(distinct qte."questionId")::int as count
        from "nauka-ppla_kb_node_to_explanation" kb
        inner join "nauka-ppla_question_to_explanation" qte
          on qte."explanationId" = kb."explanationId"
        inner join "nauka-ppla_question_instance" qi
          on qi."questionId" = qte."questionId"
        inner join "nauka-ppla_category" c on c.id = qi."categoryId"
        inner join "nauka-ppla_license" l on l.id = c."licenseId"
        group by kb."knowledgeBaseNodeId", l.url
      `,
    ]);

  const explanations = [];
  const explanationIds = new Set();
  const nodeLinks = [];
  const assets = new Set();

  for (const row of nodeExplanationRows) {
    if (!explanationIds.has(row.explanationId)) {
      explanationIds.add(row.explanationId);
      explanations.push([row.explanationId, row.type, row.explanation]);
      if (row.type === "image") assets.add(row.explanation);
    }
    nodeLinks.push([row.nodeId, row.explanationId, row.order]);
  }

  // A question can reference an explanation that is not part of an article.
  const missingExplanationIds = questionExplanationRows
    .map((row) => row.explanationId)
    .filter((id) => !explanationIds.has(id));

  if (missingExplanationIds.length > 0) {
    const missing = await sql`
      select id, type, explanation
      from "nauka-ppla_explanation"
      where id in ${sql(missingExplanationIds)}
    `;
    for (const row of missing) {
      explanations.push([row.id, row.type, row.explanation]);
      if (row.type === "image") assets.add(row.explanation);
    }
  }

  return {
    v: 1,
    n: nodes.map((node) => [
      compactId(node.id),
      node.name,
      node.slug,
      node.type,
      compactId(node.parentId),
      node.order,
    ]),
    e: explanations.map((explanation) => [
      compactId(explanation[0]),
      explanation[1],
      explanation[2],
    ]),
    ne: nodeLinks.map((link) => [
      compactId(link[0]),
      compactId(link[1]),
      link[2],
    ]),
    qe: questionExplanationRows.map((row) => [
      compactId(row.id),
      compactId(row.questionId),
      compactId(row.explanationId),
      row.order,
      row.isExtraResource,
    ]),
    qc: countRows.map((row) => [
      compactId(row.nodeId),
      row.licenseUrl,
      row.count,
    ]),
    a: [...assets].sort(),
  };
}

try {
  await mkdir(dataDirectory, { recursive: true });
  for (const filename of await readdir(dataDirectory)) {
    if (
      /^(questions-[a-z0-9-]+|knowledge-base)\.[a-f0-9]+\.json$/.test(filename)
    ) {
      await rm(path.join(dataDirectory, filename));
    }
  }

  const licenses = await sql`
    select id, name, url, version
    from "nauka-ppla_license"
    order by id
  `;

  const questionEntries = {};
  for (const license of licenses) {
    questionEntries[license.url] = await writeCatalog(
      `questions-${license.url}`,
      await generateQuestionCatalog(license),
    );
  }

  const knowledgeBase = await writeCatalog(
    "knowledge-base",
    await generateKnowledgeBaseCatalog(),
  );

  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    serialize({
      schemaVersion: 1,
      generatedAt,
      questions: questionEntries,
      knowledgeBase,
    }),
  );
} finally {
  await sql.end();
}
