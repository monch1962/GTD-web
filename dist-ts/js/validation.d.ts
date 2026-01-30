/**
 * Validation Utilities
 * Helper functions for validating task and project data
 */
/**
 * Validation result interface
 */
export interface ValidationResult {
    isValid: boolean;
    error: string | null;
}
/**
 * Validates if a context name is valid
 */
export declare function validateContextName(name: string, existingContexts?: string[]): ValidationResult;
/**
 * Validates if a task title is valid
 */
export declare function validateTaskTitle(title: string): ValidationResult;
/**
 * Validates if a project title is valid
 */
export declare function validateProjectTitle(title: string): ValidationResult;
/**
 * Validates if a date string is valid
 */
export declare function isValidDate(dateString: string): boolean;
/**
 * Validates if energy level is valid
 */
export declare function isValidEnergyLevel(energy: string): boolean;
/**
 * Validates if time estimate is valid
 */
export declare function isValidTimeEstimate(time: number): boolean;
/**
 * Validates if task status is valid
 */
export declare function isValidTaskStatus(status: string): boolean;
/**
 * Validates if project status is valid
 */
export declare function isValidProjectStatus(status: string): boolean;
//# sourceMappingURL=validation.d.ts.map