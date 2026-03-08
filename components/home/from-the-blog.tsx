import Link from "next/link"
import { getAllPosts } from "@/lib/blog"

export function FromTheBlog() {
    const posts = getAllPosts().slice(0, 3)

    if (posts.length === 0) return null

    return (
        <section className="w-full bg-white py-16 md:py-20">
            <div className="container max-w-6xl">
                <div className="mb-12 text-center">
                    <h2 className="font-heading text-4xl font-bold text-black md:text-5xl">
                        From the <span className="text-primary italic">Blog</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/50 overflow-hidden"
                        >
                            {/* Hero image */}
                            {post.frontmatter.heroImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={`/blog/images/${post.frontmatter.heroImage}`}
                                    alt={post.frontmatter.heroAlt || post.frontmatter.title}
                                    width={600}
                                    height={338}
                                    className="aspect-video w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logo.png" alt="Visual Fitment" width={48} height={48} className="opacity-40" />
                                </div>
                            )}

                            {/* Card content */}
                            <div className="flex flex-col flex-1 p-6">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
                                    {post.frontmatter.category}
                                </span>
                                <h3 className="font-heading text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                    {post.frontmatter.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                                    {post.frontmatter.subtitle}
                                </p>
                                <span className="text-xs text-muted-foreground/70">
                                    {post.frontmatter.readTime} min read
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* "Read more" link */}
                <div className="mt-10 text-center">
                    <Link
                        href="/blog"
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Read more on the blog →
                    </Link>
                </div>
            </div>
        </section>
    )
}
