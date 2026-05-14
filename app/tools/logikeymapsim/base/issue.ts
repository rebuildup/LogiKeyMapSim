export type IssueLevel = "error" | "warning" | "guide";

export type Issue = {
  level: IssueLevel;
  code: string;
  message: string;
  relatedIds: string[];
};

export function issue(level: IssueLevel, code: string, message: string, relatedIds: string[] = []): Issue {
  return { level, code, message, relatedIds };
}
