import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="4"
                y="6"
                width="40"
                height="36"
                rx="10"
                className="fill-current"
                fillOpacity="0.15"
            />
            <rect
                x="8"
                y="10"
                width="32"
                height="28"
                rx="8"
                className="stroke-current"
                strokeWidth="2.5"
            />
            <path
                d="M16 8V12M32 8V12"
                className="stroke-current"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M16 24L22 30L33 19"
                className="stroke-current"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
