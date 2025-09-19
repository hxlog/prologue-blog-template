import { useMDXComponent } from "next-contentlayer2/hooks";
import Link from "next/link";
import Image from "next/image";

const ResponsiveImage = (props) => (
  <Image
    alt={props.alt}
    src={props.src}
    loading="lazy"
    decoding="async"
    data-lightbox="true"
    className={(props.className || "") + " lightbox-image cursor-zoom-in rounded-lg mx-auto"}
    style={{ maxWidth: "100%", height: "auto" }}
    {...props}
  />
);

const ResponsiveLink = (props) => <Link target="_blank" {...props} />;

const components = {
  img: ResponsiveImage,
  a: ResponsiveLink,
};

export function MDXComponent({ code }) {
  const Component = useMDXComponent(code);

  return <Component components={components} />;
}
