import './blog.css'

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {/* Google Fonts for blog pages: DM Serif Display + DM Sans */}
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link
                rel="preconnect"
                href="https://fonts.googleapis.com"
            />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            {/* eslint-disable-next-line @next/next/no-page-custom-font */}
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display&display=swap"
                rel="stylesheet"
            />
            <div className="blog-page">
                {children}
            </div>
        </>
    )
}
