/**
 * Header Buttons Configuration
 * Single source of truth for all header menu button definitions
 */
export interface HeaderButton {
    id: string;
    title: string;
    ariaLabel: string;
    icon: string;
    essentialOnMobile: boolean;
    alwaysVisible: boolean;
}
export declare const headerButtons: HeaderButton[];
//# sourceMappingURL=headerButtons.d.ts.map