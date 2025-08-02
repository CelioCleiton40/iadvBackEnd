import { JuizData } from '../../types/judgeTypes';

const juizesDB: Record<string, JuizData> = {};

export const JudgeModel = {
  save(juizId: string, data: JuizData) {
    juizesDB[juizId] = data;
  },
  get(juizId: string): JuizData | null {
    return juizesDB[juizId] || null;
  }
};