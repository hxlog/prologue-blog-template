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
  // useMDXComponent returns a component that is created based on the MDX code.
  // ESLint may flag this as creating components during render (a false
  // positive for this pattern). The components prop we're passing is
  // module-scoped and stable, so it's safe to render the returned Component.
  // The rule `react-hooks/static-components` can complain because the
  // returned Component is created from runtime MDX code. This is a known
  // pattern with contentlayer/MDX and is safe as long as `components` is
  // module-scoped (stable). Silence the false positive on the JSX usage
  // below where the linter detects a component created during render.
  const Component = useMDXComponent(code);

  // eslint-disable-next-line react-hooks/static-components
  return <Component components={components} />;
}
