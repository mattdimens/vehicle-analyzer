import './blog.css'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import { BlogEntryDoor } from '@/components/blog-entry-door'

// Self-hosted via next/font (no render-blocking request to fonts.googleapis.com)
const dmSans = DM_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    style: ['normal', 'italic'],
    variable: '--font-dm-sans',
})

const dmSerifDisplay = DM_Serif_Display({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-dm-serif-display',
})

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <BlogEntryDoor />
            <div className={`blog-page ${dmSans.variable} ${dmSerifDisplay.variable}`}>
                {children}
            </div>
        </>
    )
}
