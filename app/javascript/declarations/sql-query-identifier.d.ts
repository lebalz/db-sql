declare module 'sql-query-identifier' {
  export interface Command {
    end: number;
    executionType: string;
    start: number;
    text: string;
    ​​type: string;
  }
  export function identify(query: string): Command[];
}
