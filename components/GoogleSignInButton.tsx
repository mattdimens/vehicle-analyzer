import React from 'react';

const GoogleLogo = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        <path fill="none" d="M0 0h48v48H0z" />
    </svg>
);

export interface GoogleSignInButtonProps {
    onClick: () => void | Promise<void>;
    variant?: "outline" | "filled";
    size?: "large" | "medium" | "small";
    text?: string;
    fullWidth?: boolean;
    disabled?: boolean;
}

export function GoogleSignInButton({
    onClick,
    variant = "outline",
    size = "medium",
    text = "Sign in with Google",
    fullWidth = false,
    disabled = false,
}: GoogleSignInButtonProps) {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 shrink-0 select-none";

    const sizeClasses = {
        large: "h-[48px] px-[24px] text-[16px]",
        medium: "h-[40px] px-[20px] text-[14px]",
        small: "h-[36px] px-[16px] text-[13px]",
    };

    const layoutClasses = fullWidth ? "w-full" : "";
    const disabledClasses = disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer";

    // Outline variant (white)
    // White background, #dadce0 border, #3c4043 text color
    // On hover: #f8f9fa background with subtle shadow lift
    const outlineClasses = disabled
        ? "bg-white border-[1px] border-[#dadce0] text-[#3c4043]"
        : "bg-white border-[1px] border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa] hover:shadow-[0_1px_3px_rgba(60,64,67,0.15)] active:bg-[#e8eaed]";

    // Filled variant (blue)
    // #4285F4 background, white text
    // On hover: #2b6fe0 with blue glow shadow.
    // The Google "G" logo sits inside a small white rounded rectangle.
    const filledClasses = disabled
        ? "bg-[#4285F4] text-white border-[1px] border-transparent"
        : "bg-[#4285F4] text-white border-[1px] border-transparent hover:bg-[#2b6fe0] hover:shadow-[0_4px_12px_rgba(66,133,244,0.4)] active:bg-[#1a5bc4]";

    const variantClasses = variant === "filled" ? filledClasses : outlineClasses;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${sizeClasses[size]} ${layoutClasses} ${disabledClasses} ${variantClasses}`}
            style={{
                fontFamily: "'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                letterSpacing: "0.25px",
                fontWeight: 500,
            }}
        >
            {variant === "filled" ? (
                <span className="flex items-center justify-center w-8 h-8 mr-3 bg-white rounded-[2px] shrink-0">
                    <GoogleLogo />
                </span>
            ) : (
                <span className="mr-3 shrink-0 flex items-center justify-center">
                    <GoogleLogo />
                </span>
            )}
            <span>{text}</span>
        </button>
    );
}
