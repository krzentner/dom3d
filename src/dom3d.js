// Main function invoked on browser action click
export function dom3d(SHOW_SIDES, COLOR_SURFACE, COLOR_RANDOM, ZOOM_ENABLED) {
  const HUE_SELECTORS = [
    {
      selector: 'h1',
      hue: 290
    }
  ]
  const DEFAULT_HUE = 190;
  const MAX_ROTATION = 180; // set to 360 to rotate all the way round
  const THICKNESS = 20; // thickness of layers
  const PERSPECTIVE = 1000; // akin to FOV

  let rotationX = 0;
  let rotationY = 0;
  let zoomLevel = 1;

  const getBodyTransform = () => `rotateX(${rotationY}deg) rotateY(${rotationX}deg) scale(${zoomLevel})`;
  const getDOMDepth = element => [...element.children].reduce((max, child) => Math.max(max, getDOMDepth(child)), 0) + 1;
  const domDepthCache = getDOMDepth(document.body);
  const getColorByDepth = (depth, hue = 0, lighten = 0) => `hsl(${hue}, 75%, ${Math.min(10 + depth * (1 + 60 / domDepthCache), 90) + lighten}%)`;

  // Apply initial styles to the body to enable 3D perspective
  const body = document.body;
  const html = document.documentElement;
  html.style.background = body.style.background;
  body.style.overflow = "visible";
  body.style.transformStyle = "preserve-3d";
  body.style.perspective = PERSPECTIVE;
  const perspectiveOriginX = (window.innerWidth / 2);
  const perspectiveOriginY = (window.innerHeight / 2);
  body.style.perspectiveOrigin = body.style.transformOrigin = `${perspectiveOriginX}px ${perspectiveOriginY}px`;
  traverseDOM(body, 0, 0, 0);

  // Rotate the DOM based on mouse movement
  document.addEventListener("pointermove", (event) => {
    rotationY = (MAX_ROTATION * (1 - event.clientY / window.innerHeight) - (MAX_ROTATION / 2));
    rotationX = (MAX_ROTATION * event.clientX / window.innerWidth - (MAX_ROTATION / 2));
    body.style.transform = getBodyTransform()
  });

  // Zoom in/out based on mouse wheel if enabled
  document.addEventListener("wheel", (event) => {
    if (!ZOOM_ENABLED) return;
    event.preventDefault();
    zoomLevel = Math.max(0.1, Math.min(zoomLevel + event.deltaY * 0.001, 2)); // Example: min 500, max 20000
    body.style.transform = getBodyTransform();
  }, { passive: false });



  // Recursive function to traverse child nodes, apply 3D styles, and create side faces
  function traverseDOM(parentNode, depthLevel, offsetX, offsetY) {
    for (let children = parentNode.childNodes, childrenCount = children.length, i = 0; i < childrenCount; i++) {
      const node = children[i];
      if (!(1 === node.nodeType && !node.classList.contains('dom-3d-side-face'))) continue;

      // Set the color based on the selector or default hue
      const hueSelector = HUE_SELECTORS.find(hue => node.matches(hue.selector));
      const hue = hueSelector ? hueSelector.hue : DEFAULT_HUE;
      const color = COLOR_RANDOM ? getRandomColor() : getColorByDepth(depthLevel, hue, -5);

      // Apply the styles to the child node
      Object.assign(node.style, {
        transform: `translateZ(${THICKNESS}px)`,
        overflow: "visible",
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
        backgroundColor: COLOR_SURFACE ? color : getComputedStyle(node).backgroundColor,
        willChange: 'transform',
      });

      let updatedOffsetX = offsetX;
      let updatedOffsetY = offsetY;
      if (node.offsetParent === parentNode) {
        updatedOffsetX += parentNode.offsetLeft;
        updatedOffsetY += parentNode.offsetTop;
      }
      createSideFaces(node, color);
      traverseDOM(node, depthLevel + 1, updatedOffsetX, updatedOffsetY);
    }
  }

  //! UTILS —————————————————————————————————————————————————————

  function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 40 + Math.floor(Math.random() * 30);
    const lightness = 30 + Math.floor(Math.random() * 30);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  // Create side faces for an element to give it a 3D appearance
  function createSideFaces(element, color) {
    if (!SHOW_SIDES) { return }
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const fragment = document.createDocumentFragment();

    // Helper function to create and style a face
    const createFace = ({ width, height, transform, transformOrigin, top, left, right, bottom }) => {
      const face = document.createElement('div');
      face.className = 'dom-3d-side-face';
      Object.assign(face.style, {
        transformStyle: "preserve-3d",
        backfaceVisibility: 'hidden',
        position: 'absolute',
        width: `${width}px`,
        height: `${height}px`,
        background: color,
        transform,
        transformOrigin,
        overflow: 'hidden',
        willChange: 'transform',
        top,
        left,
        right,
        bottom
      });
      fragment.appendChild(face);
    }

    // Top face
    createFace({
      width,
      height: THICKNESS,
      transform: `rotateX(-270deg) translateY(${-THICKNESS}px)`,
      transformOrigin: 'top',
      top: '0px',
      left: '0px',
    });

    // Right face
    createFace({
      width: THICKNESS,
      height,
      transform: 'rotateY(90deg)',
      transformOrigin: 'left',
      top: '0px',
      left: `${width}px`
    });

    // Bottom face
    createFace({
      width,
      height: THICKNESS,
      transform: `rotateX(-90deg) translateY(${THICKNESS}px)`,
      transformOrigin: 'bottom',
      bottom: '0px',
      left: '0px'
    });

    // Left face
    createFace({
      width: THICKNESS,
      height,
      transform: `translateX(${-THICKNESS}px) rotateY(-90deg)`,
      transformOrigin: 'right',
      top: '0px',
      left: '0px'
    });

    element.appendChild(fragment);
  }
}
