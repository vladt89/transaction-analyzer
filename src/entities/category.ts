import {CategoryKey} from "./expenses";

export type CategoryDefinition = {
    key: CategoryKey;
    merchantShortNames: string[];
};