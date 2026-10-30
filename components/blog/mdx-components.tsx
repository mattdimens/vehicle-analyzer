import React from 'react'

/* ------------------------------------------------------------------ */
/*  SpeakableSummary                                                   */
/*  Renders a paragraph with class "speakable-summary" for Speakable  */
/*  schema targeting. Visually identical to a normal paragraph.        */
/* ------------------------------------------------------------------ */
export function SpeakableSummary({ children }: { children: React.ReactNode }) {
    return <div className="speakable-summary">{children}</div>
}

/* ------------------------------------------------------------------ */
/*  Callout                                                            */
/*  Renders a callout box with an orange left border and bold label.   */
/* ------------------------------------------------------------------ */
export function Callout({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="callout">
            <strong>{label}:</strong> {children}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  ComparisonTable                                                    */
/*  Renders a table with Schema.org Table microdata.                  */
/* ------------------------------------------------------------------ */
export function ComparisonTable({
    about,
    columns,
    rows,
}: {
    about: string
    columns: string
    rows: string
}) {
    // next-mdx-remote blocks JS expressions in MDX, so columns and rows must be
    // JSON strings: columns='["A", "B"]' (write an apostrophe as &apos;). Written
    // any other way they arrive empty, so stop the build rather than lose the table.
    let parsedColumns: string[]
    let parsedRows: string[][]

    try {
        parsedColumns = JSON.parse(columns)
        parsedRows = JSON.parse(rows)
    } catch {
        throw new Error(`ComparisonTable "${about}": columns and rows must be JSON strings`)
    }

    if (parsedRows.some((row) => row.length !== parsedColumns.length)) {
        throw new Error(`ComparisonTable "${about}": every row needs ${parsedColumns.length} cells`)
    }

    return (
        <div
            className="comparison-table-wrap"
            itemScope
            itemType="https://schema.org/Table"
        >
            <meta itemProp="about" content={about} />
            <table className="comparison-table">
                <thead>
                    <tr>
                        {parsedColumns.map((col, i) => (
                            <th key={i} scope="col">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {parsedRows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                            {row.map((cell, cellIdx) => (
                                <td key={cellIdx}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  ArticleImage                                                       */
/*  Renders a figure with image and optional caption.                 */
/* ------------------------------------------------------------------ */
export function ArticleImage({
    src,
    alt,
    caption,
}: {
    src: string
    alt: string
    caption?: string
}) {
    return (
        <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} width={760} height={428} loading="lazy" />
            {caption && <figcaption>{caption}</figcaption>}
        </figure>
    )
}

/* ------------------------------------------------------------------ */
/*  Component map for MDX provider                                    */
/* ------------------------------------------------------------------ */
export const mdxComponents = {
    SpeakableSummary,
    Callout,
    ComparisonTable,
    ArticleImage,
}
