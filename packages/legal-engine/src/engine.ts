import {
  ConsolidatedLawDocument,
  ProvisionNode,
  ChangeSetPayload,
  ChangeOperationPayload,
} from '@lexvera/types';

/**
 * Deterministic Law Consolidation Reconstructor
 * Rekonstruksi point-in-time naskah perundang-undangan Indonesia
 */
export class LawReconstructor {
  /**
   * Menghasilkan naskah konsolidasi snapshot pada tanggal tertentu
   */
  public static reconstructAtDate(
    baseDocument: ConsolidatedLawDocument,
    changeSets: ChangeSetPayload[],
    targetDate: string
  ): ConsolidatedLawDocument {
    const targetTimestamp = new Date(targetDate).getTime();

    // 1. Deep clone base document agar immutable
    const result: ConsolidatedLawDocument = JSON.parse(JSON.stringify(baseDocument));
    result.asOfDate = targetDate;
    result.activeAmendingInstruments = [];

    // 2. Filter dan urutkan ChangeSet yang berlaku <= targetDate
    const applicableSets = changeSets
      .filter((cs) => new Date(cs.effectiveFrom).getTime() <= targetTimestamp)
      .sort(
        (a, b) =>
          new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime()
      );

    // 3. Eksekusi operasi secara sekuensial
    for (const changeSet of applicableSets) {
      if (!result.activeAmendingInstruments.includes(changeSet.amendingInstrument)) {
        result.activeAmendingInstruments.push(changeSet.amendingInstrument);
      }

      // Urutkan operasi dalam ChangeSet
      const sortedOps = [...changeSet.operations].sort(
        (a, b) => a.orderInSet - b.orderInSet
      );

      for (const op of sortedOps) {
        this.applyOperation(result.nodes, op, changeSet.amendingInstrument);
      }
    }

    if (result.activeAmendingInstruments.length > 0) {
      result.status = 'DIUBAH';
    }

    return result;
  }

  private static applyOperation(
    nodes: ProvisionNode[],
    op: ChangeOperationPayload,
    amendingInstrumentName: string
  ): boolean {
    switch (op.operationType) {
      case 'REPLACE_PROVISION': {
        const target = this.findNodeByPath(nodes, op.targetCanonicalPath);
        if (target) {
          target.content = op.newContent;
          if (op.newExplanation !== undefined) {
            target.explanation = op.newExplanation;
          }
          target.versionTag = `AMENDED_BY_${amendingInstrumentName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          return true;
        }
        return false;
      }

      case 'REPEAL_PROVISION': {
        const target = this.findNodeByPath(nodes, op.targetCanonicalPath);
        if (target) {
          target.isRepealed = true;
          target.repealBasis = op.sourceReference;
          // BR-02: Norma yang dicabut tetap ada dengan tanda "Dihapus"
          target.content = `Dihapus. (${op.sourceReference})`;
          target.versionTag = `REPEALED_BY_${amendingInstrumentName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          return true;
        }
        return false;
      }

      case 'ADD_PROVISION': {
        if (op.parentCanonicalPath) {
          const parent = this.findNodeByPath(nodes, op.parentCanonicalPath);
          if (parent) {
            this.insertOrderedChild(parent.children, op.newNode);
            return true;
          }
        } else {
          this.insertOrderedChild(nodes, op.newNode);
          return true;
        }
        return false;
      }

      case 'PARTIAL_REPEAL': {
        const target = this.findNodeByPath(nodes, op.targetCanonicalPath);
        if (target) {
          target.content = op.resultingContent;
          target.versionTag = `PARTIALLY_REPEALED_BY_${amendingInstrumentName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          return true;
        }
        return false;
      }

      default:
        return false;
    }
  }

  private static findNodeByPath(
    nodes: ProvisionNode[],
    canonicalPath: string
  ): ProvisionNode | null {
    for (const node of nodes) {
      if (node.canonicalPath === canonicalPath) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findNodeByPath(node.children, canonicalPath);
        if (found) return found;
      }
    }
    return null;
  }

  private static insertOrderedChild(
    list: ProvisionNode[],
    newNode: ProvisionNode
  ): void {
    const existingIndex = list.findIndex(
      (n) => n.canonicalPath === newNode.canonicalPath
    );
    if (existingIndex >= 0) {
      list[existingIndex] = newNode;
    } else {
      list.push(newNode);
      list.sort((a, b) => a.orderIndex - b.orderIndex);
    }
  }
}
