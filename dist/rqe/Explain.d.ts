import { MountPoint } from './MountPoint';
import { QueryTuple } from './QueryTuple';
export declare function explainWhyQueryFails(tuple: QueryTuple, table: MountPoint): {
    missingRequired: string[];
    missingRequiredValue: string[];
    extraAttrs: string[];
};
