import { Severity, WorkerType } from './enums/constants';

export interface Finding {
  file: string;
  line: number;
  severity: Severity;
  category: string;
  explanation: string;
  fix: string;
  workerType: WorkerType;
}

export interface WorkerResult {
  workerType: WorkerType;
  findings: Finding[];
}
