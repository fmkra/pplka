"use client";

import Dexie, { type EntityTable } from "dexie";
import type { Explanation } from "~/server/db/explanation";
import type { KnowledgeBaseNode } from "~/server/api/routers/explanation";
import {
  expandCatalogId,
  type KnowledgeBaseCatalog,
  type QuestionCatalog,
} from "./catalog-schema";

export const KNOWLEDGE_BASE_PACKAGE = "knowledge-base";

export type InstalledPackage = {
  key: string;
  version: string;
  sourceVersion?: number;
  installedAt: string;
  assetUrls?: string[];
};

export type LocalQuestion = {
  key: string;
  packageKey: string;
  id: string;
  externalId: string | null;
  question: string;
  answerCorrect: string;
  answerIncorrect1: string;
  answerIncorrect2: string;
  answerIncorrect3: string;
  hasExplanation: boolean;
  knowledgeBaseNodeIds: string[];
};

export type LocalQuestionInstance = {
  key: string;
  packageKey: string;
  id: string;
  questionId: string;
  categoryId: number;
};

export type LocalCategory = {
  key: string;
  packageKey: string;
  id: number;
  name: string;
  url: string;
  color: string | null;
  icon: string | null;
  description: string | null;
  topics: string[] | null;
  examTime: number;
  examQuestionCount: number;
};

export type LocalKnowledgeBaseNode = KnowledgeBaseNode & { key: string };
export type LocalExplanation = Explanation & { key: string };

export type LocalNodeExplanation = {
  key: string;
  nodeId: string;
  explanationId: string;
  order: number;
};

export type LocalQuestionExplanation = {
  key: string;
  id: string;
  questionId: string;
  explanationId: string;
  order: number;
  isExtraResource: boolean;
};

export type LocalQuestionCount = {
  key: string;
  nodeId: string;
  licenseUrl: string;
  count: number;
};

class CatalogDatabase extends Dexie {
  packages!: EntityTable<InstalledPackage, "key">;
  questions!: EntityTable<LocalQuestion, "key">;
  questionInstances!: EntityTable<LocalQuestionInstance, "key">;
  categories!: EntityTable<LocalCategory, "key">;
  knowledgeBaseNodes!: EntityTable<LocalKnowledgeBaseNode, "key">;
  explanations!: EntityTable<LocalExplanation, "key">;
  nodeExplanations!: EntityTable<LocalNodeExplanation, "key">;
  questionExplanations!: EntityTable<LocalQuestionExplanation, "key">;
  questionCounts!: EntityTable<LocalQuestionCount, "key">;

  constructor() {
    super("pplka-catalogs");
    this.version(1).stores({
      packages: "key, installedAt",
      questions: "key, packageKey, id, externalId",
      questionInstances:
        "key, packageKey, id, questionId, categoryId, [packageKey+categoryId]",
      categories: "key, packageKey, id, [packageKey+id]",
      knowledgeBaseNodes: "key, id, slug, parentId, [parentId+order]",
      explanations: "key, id, type",
      nodeExplanations: "key, nodeId, explanationId, [nodeId+order]",
      questionExplanations:
        "key, id, questionId, explanationId, [questionId+order]",
      questionCounts: "key, nodeId, licenseUrl, [nodeId+licenseUrl]",
    });
  }
}

export const catalogDb = new CatalogDatabase();

export function questionPackageKey(licenseUrl: string) {
  return `questions:${licenseUrl}`;
}

export async function installQuestionCatalog(
  catalog: QuestionCatalog,
  version: string,
) {
  const [licenseId, licenseUrl, , sourceVersion] = catalog.l;
  const packageKey = questionPackageKey(licenseUrl);
  const questions: LocalQuestion[] = catalog.q.map((question) => ({
    key: `${packageKey}:${expandCatalogId(question[0])}`,
    packageKey,
    id: expandCatalogId(question[0]),
    externalId: question[1],
    question: question[2],
    answerCorrect: question[3],
    answerIncorrect1: question[4],
    answerIncorrect2: question[5],
    answerIncorrect3: question[6],
    hasExplanation: question[7],
    knowledgeBaseNodeIds: question[8].map((id) => expandCatalogId(id)),
  }));
  const instances: LocalQuestionInstance[] = catalog.i.map((instance) => ({
    key: `${packageKey}:${expandCatalogId(instance[0])}`,
    packageKey,
    id: expandCatalogId(instance[0]),
    questionId: expandCatalogId(catalog.q[instance[1]]![0]),
    categoryId: instance[2],
  }));
  const categories: LocalCategory[] = catalog.c.map((category) => ({
    key: `${packageKey}:${category[0]}`,
    packageKey,
    id: category[0],
    name: category[1],
    url: category[2],
    color: category[3],
    icon: category[4],
    description: category[5],
    topics: category[6],
    examTime: category[7],
    examQuestionCount: category[8],
  }));

  await catalogDb.transaction(
    "rw",
    [
      catalogDb.packages,
      catalogDb.questions,
      catalogDb.questionInstances,
      catalogDb.categories,
    ],
    async () => {
      await Promise.all([
        catalogDb.questions.where("packageKey").equals(packageKey).delete(),
        catalogDb.questionInstances
          .where("packageKey")
          .equals(packageKey)
          .delete(),
        catalogDb.categories.where("packageKey").equals(packageKey).delete(),
      ]);
      await catalogDb.questions.bulkPut(questions);
      await catalogDb.questionInstances.bulkPut(instances);
      await catalogDb.categories.bulkPut(categories);
      await catalogDb.packages.put({
        key: packageKey,
        version,
        sourceVersion,
        installedAt: new Date().toISOString(),
      });
    },
  );

  return { licenseId, licenseUrl };
}

export async function removeQuestionCatalog(licenseUrl: string) {
  const packageKey = questionPackageKey(licenseUrl);
  await catalogDb.transaction(
    "rw",
    [
      catalogDb.packages,
      catalogDb.questions,
      catalogDb.questionInstances,
      catalogDb.categories,
    ],
    async () => {
      await Promise.all([
        catalogDb.questions.where("packageKey").equals(packageKey).delete(),
        catalogDb.questionInstances
          .where("packageKey")
          .equals(packageKey)
          .delete(),
        catalogDb.categories.where("packageKey").equals(packageKey).delete(),
        catalogDb.packages.delete(packageKey),
      ]);
    },
  );
}

export async function installKnowledgeBaseCatalog(
  catalog: KnowledgeBaseCatalog,
  version: string,
) {
  const nodes: LocalKnowledgeBaseNode[] = catalog.n.map((node) => ({
    key: expandCatalogId(node[0]),
    id: expandCatalogId(node[0]),
    name: node[1],
    slug: node[2],
    type: node[3],
    parentId: expandCatalogId(node[4]),
    order: node[5],
    createdAt: null,
  }));
  const explanations: LocalExplanation[] = catalog.e.map((explanation) => ({
    key: expandCatalogId(explanation[0]),
    id: expandCatalogId(explanation[0]),
    type: explanation[1],
    explanation: explanation[2],
  }));
  const nodeExplanations: LocalNodeExplanation[] = catalog.ne.map((link) => ({
    key: `${expandCatalogId(link[0])}:${link[2]}:${expandCatalogId(link[1])}`,
    nodeId: expandCatalogId(link[0]),
    explanationId: expandCatalogId(link[1]),
    order: link[2],
  }));
  const questionExplanations: LocalQuestionExplanation[] = catalog.qe.map(
    (link) => ({
      key: expandCatalogId(link[0]),
      id: expandCatalogId(link[0]),
      questionId: expandCatalogId(link[1]),
      explanationId: expandCatalogId(link[2]),
      order: link[3],
      isExtraResource: link[4],
    }),
  );
  const questionCounts: LocalQuestionCount[] = catalog.qc.map((count) => ({
    key: `${expandCatalogId(count[0])}:${count[1]}`,
    nodeId: expandCatalogId(count[0]),
    licenseUrl: count[1],
    count: count[2],
  }));

  await catalogDb.transaction(
    "rw",
    [
      catalogDb.packages,
      catalogDb.knowledgeBaseNodes,
      catalogDb.explanations,
      catalogDb.nodeExplanations,
      catalogDb.questionExplanations,
      catalogDb.questionCounts,
    ],
    async () => {
      await Promise.all([
        catalogDb.knowledgeBaseNodes.clear(),
        catalogDb.explanations.clear(),
        catalogDb.nodeExplanations.clear(),
        catalogDb.questionExplanations.clear(),
        catalogDb.questionCounts.clear(),
      ]);
      await catalogDb.knowledgeBaseNodes.bulkPut(nodes);
      await catalogDb.explanations.bulkPut(explanations);
      await catalogDb.nodeExplanations.bulkPut(nodeExplanations);
      await catalogDb.questionExplanations.bulkPut(questionExplanations);
      await catalogDb.questionCounts.bulkPut(questionCounts);
      await catalogDb.packages.put({
        key: KNOWLEDGE_BASE_PACKAGE,
        version,
        installedAt: new Date().toISOString(),
        assetUrls: catalog.a,
      });
    },
  );
}

export async function removeKnowledgeBaseCatalog() {
  await catalogDb.transaction(
    "rw",
    [
      catalogDb.packages,
      catalogDb.knowledgeBaseNodes,
      catalogDb.explanations,
      catalogDb.nodeExplanations,
      catalogDb.questionExplanations,
      catalogDb.questionCounts,
    ],
    async () => {
      await Promise.all([
        catalogDb.knowledgeBaseNodes.clear(),
        catalogDb.explanations.clear(),
        catalogDb.nodeExplanations.clear(),
        catalogDb.questionExplanations.clear(),
        catalogDb.questionCounts.clear(),
        catalogDb.packages.delete(KNOWLEDGE_BASE_PACKAGE),
      ]);
    },
  );
}
