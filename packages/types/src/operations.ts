import { ProvisionNode } from './legal-ast';

export type OperationType =
  | 'ADD_PROVISION'
  | 'REPLACE_PROVISION'
  | 'REPEAL_PROVISION'
  | 'PARTIAL_REPEAL'
  | 'RENUMBER'
  | 'JUDICIAL_OVERRIDE';

export interface BaseChangeOperation {
  id: string;
  orderInSet: number;
  operationType: OperationType;
  sourceReference: string; // e.g. "Pasal I angka 2 UU No. 19 Tahun 2016"
  targetCanonicalPath: string; // e.g. "uu-11-2008/pasal-27/ayat-3"
}

export interface AddProvisionOperation extends BaseChangeOperation {
  operationType: 'ADD_PROVISION';
  parentCanonicalPath?: string;
  newNode: ProvisionNode;
}

export interface ReplaceProvisionOperation extends BaseChangeOperation {
  operationType: 'REPLACE_PROVISION';
  previousContent: string;
  newContent: string;
  newExplanation?: string;
}

export interface RepealProvisionOperation extends BaseChangeOperation {
  operationType: 'REPEAL_PROVISION';
  repealNote: string;
}

export interface PartialRepealOperation extends BaseChangeOperation {
  operationType: 'PARTIAL_REPEAL';
  repealedPhrase: string;
  resultingContent: string;
}

export type ChangeOperationPayload =
  | AddProvisionOperation
  | ReplaceProvisionOperation
  | RepealProvisionOperation
  | PartialRepealOperation;

export interface ChangeSetPayload {
  id: string;
  amendingInstrument: string; // e.g. "UU 19/2016"
  targetInstrument: string;   // e.g. "UU 11/2008"
  effectiveFrom: string;      // ISO 8601
  title: string;
  operations: ChangeOperationPayload[];
}
