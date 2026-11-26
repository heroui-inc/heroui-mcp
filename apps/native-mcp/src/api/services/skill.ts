/**
 * Service for accessing the HeroUI Native skills extracted to R2
 */

import type {ObjectStore} from "../lib/object-store";
import type {SkillsDataset} from "@shared/types/skills";

import {createObjectStore} from "../lib/object-store";

const SKILLS_KEY = "native/v1/latest/skills.json";

class SkillService {
  constructor(private readonly store: ObjectStore) {}

  /** The extracted skills, or null when the extraction has not run yet. */
  async getSkills(): Promise<SkillsDataset | null> {
    const body = await this.store.get(SKILLS_KEY);

    return body === null ? null : (JSON.parse(body) as SkillsDataset);
  }
}

let skillService: SkillService | null = null;

export const getSkillService = async (env: Record<string, any>): Promise<SkillService> => {
  if (!skillService) {
    skillService = new SkillService(createObjectStore(env));
  }

  return skillService;
};
