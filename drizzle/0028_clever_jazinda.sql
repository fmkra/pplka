CREATE INDEX "exam_attempt_user_category_started_idx" ON "nauka-ppla_exam_attempt" USING btree ("userId","categoryId","startedAt");--> statement-breakpoint
CREATE INDEX "exam_questions_attempt_idx" ON "nauka-ppla_exam_questions" USING btree ("examAttemptId");--> statement-breakpoint
CREATE INDEX "question_instance_category_idx" ON "nauka-ppla_question_instance" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "question_instance_question_idx" ON "nauka-ppla_question_instance" USING btree ("questionId");