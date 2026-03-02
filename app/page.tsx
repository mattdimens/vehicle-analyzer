import type { Metadata } from "next"
import { VehicleAnalyzer } from "@/components/home/vehicle-analyzer"
import { RelatedPages } from "@/components/ui/related-pages"

export const metadata: Metadata = {
  title: "Find Vehicle Fitment, Parts, & Accessories From an Image | Visual Fitment",
  description:
    "Instantly identify vehicle fitment, parts, and accessories just from a photo. Upload an image of any car or truck to get a detailed analysis.",
}

// HowTo JSON-LD: describes the 2-step process shown on the homepage
const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Identify Vehicle Fitment and Parts From a Photo",
  description:
    "Use Visual Fitment to upload a vehicle or part photo and get instant fitment and product results powered by AI.",
  step: [
    {
      "@type": "HowToStep",
      name: "Upload a Photo",
      text: "Upload a photo of a full vehicle or a close-up of a specific part. Drag and drop or select from your device.",
      position: 1,
    },
    {
      "@type": "HowToStep",
      name: "Get Instant Results",
      text: "In seconds, get a detailed breakdown: vehicle specs, identified parts, and direct links to buy compatible accessories.",
      position: 2,
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <VehicleAnalyzer
        showCategories={true}
        relatedContent={
          <RelatedPages
            items={[
              {
                title: "Part Identifier",
                description: "Identify individual car parts from a photo, perfect for loose parts or unknown components.",
                href: "/part-identifier"
              },
              {
                title: "Wheels & Rims Analysis",
                description: "Get bolt pattern, offset, and fitment data for wheels. Find the perfect stance.",
                href: "/wheels-rims"
              },
              {
                title: "Truck Bed Covers",
                description: "Measure your bed length and cab style to find compatible tonneau covers.",
                href: "/truck-bed-covers"
              }
            ]}
          />
        }
      />
    </>
  )
}