/** Width-constrained page container. */
function Container({ as: Tag = "div", className = "", children }) {
  return <Tag className={`container ${className}`.trim()}>{children}</Tag>;
}

export default Container;
