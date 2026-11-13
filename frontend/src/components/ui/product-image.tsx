import NextImage, { type ImageProps } from "next/image";

/**
 * next/image for product photos. Bundled images (/products/...) are optimised;
 * images uploaded through the admin live on the Python API host and are served as-is.
 */
export default function ProductImage(props: ImageProps) {
  const remote = typeof props.src === "string" && /^https?:\/\//.test(props.src);
  return <NextImage {...props} unoptimized={props.unoptimized ?? remote} />;
}
