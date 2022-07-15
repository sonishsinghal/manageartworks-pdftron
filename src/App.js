import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import WebViewer from "@pdftron/webviewer";
import "./App.css";
import PreviewPopup, { Face } from "./components/PreviewPopup";
import { Button, Modal } from "@mui/material";

function App() {
  const viewer = useRef(null);
  const [textures, setTextures] = useState([]);
  const [approved, setApproved] = useState(0);

  const [openSnippet, setOpenSnippet] = useState(false);
  const handleOpenSnippet = () => setOpenSnippet(true);
  const handleCloseSnippet = () => setOpenSnippet(false);

  const removeTexture = (index) => {
    const copyOfT = [...textures];
    setApproved(approved - 1);
    setTextures(copyOfT.splice(index));
  };
  useEffect(() => {
    // const downloadURI = (uri, name) => {
    //   const link = document.createElement("a");
    //   link.download = name;
    //   link.href = uri;
    //   document.body.appendChild(link);
    //   link.click();
    //   document.body.removeChild(link);
    // };
    WebViewer(
      {
        path: "/webviewer/lib",
        initialDoc:"/assets/pdftron_using_guide.pdf",
        enableFilePicker: true, // enable FILE SYSTEM
      },
      viewer.current
    ).then((instance) => {
      // sniping tool code
      const { docViewer, Annotations, Tools, iframeWindow, annotManager } =
        instance;

      const createSnipTool = function () {
        const SnipTool = function () {
          Tools.RectangleCreateTool.apply(this, arguments);
          this.defaults.StrokeColor = new Annotations.Color("#F69A00");
          this.defaults.StrokeThickness = 2;
        };

        SnipTool.prototype = new Tools.RectangleCreateTool();

        return new SnipTool(docViewer);
      };

      const customSnipTool = createSnipTool();

      instance.registerTool({
        toolName: "SnipTool",
        toolObject: customSnipTool,
        buttonImage: "/cut-solid.svg",
        buttonName: "snipToolButton",
        tooltip: "Snipping Tool",
      });

      instance.setHeaderItems((header) => {
        header.push({
          type: "toolButton",
          toolName: "SnipTool",
        });
      });

      customSnipTool.on("annotationAdded", (annotation) => {
        const pageNumber = annotation.PageNumber;
        // get the canvas for the page
        const pageContainer = iframeWindow.document.getElementById(
          "pageContainer" + pageNumber
        );
        const pageCanvas = pageContainer.querySelector(".canvas" + pageNumber);

        const scale = window.devicePixelRatio;
        const topOffset = (parseFloat(pageCanvas.style.top) || 0) * scale;
        const leftOffset = (parseFloat(pageCanvas.style.left) || 0) * scale;
        const zoom = docViewer.getZoomLevel() * scale;

        const x = annotation.X * zoom - leftOffset;
        const y = annotation.Y * zoom - topOffset;
        const width = annotation.Width * zoom;
        const height = annotation.Height * zoom;

        const copyCanvas = document.createElement("canvas");
        copyCanvas.width = width;
        copyCanvas.height = height;
        const ctx = copyCanvas.getContext("2d");

        // copy the image data from the page to a new canvas so we can get the data URL

        ctx.drawImage(pageCanvas, x, y, width, height, 0, 0, width, height);

        const imageURL = copyCanvas.toDataURL();

        // console.log(widthList, heightList);

        //popup to check the image url, wont be rendered yet

        //add to texture state if the snippet is correct
        setTextures((pre) => [...pre, imageURL]);
        handleOpenSnippet();

        // downloadURI(copyCanvas.toDataURL(), "sample.jpeg");

        annotManager.deleteAnnotation(annotation);
      });
    });
  }, []);

  const exportModel = async (textures) => {
    function exportGLTF(input) {
      const gltfExporter = new GLTFExporter();

      const options = {
        trs: params.trs,
        onlyVisible: params.onlyVisible,
        truncateDrawRange: params.truncateDrawRange,
        binary: params.binary,
        maxTextureSize: params.maxTextureSize,
      };
      gltfExporter.parse(
        input,
        function (result) {
          if (result instanceof ArrayBuffer) {
            saveArrayBuffer(result, "scene.glb");
          } else {
            const output = JSON.stringify(result, null, 2);
            console.log(output);
            saveString(output, "scene.gltf");
          }
        },
        function (error) {
          console.log("An error happened during parsing", error);
        },
        options
      );
    }

    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link); // Firefox workaround, see #6594

    function save(blob, filename) {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      // URL.revokeObjectURL( url ); breaks Firefox...
    }

    function saveString(text, filename) {
      save(new Blob([text], { type: "text/plain" }), filename);
    }

    function saveArrayBuffer(buffer, filename) {
      save(new Blob([buffer], { type: "application/octet-stream" }), filename);
    }

    let camera, object, scene1;

    const params = {
      trs: false,
      onlyVisible: true,
      truncateDrawRange: true,
      binary: false,
      maxTextureSize: 4096,
    };

    init();

    async function init() {
      scene1 = new THREE.Scene();
      scene1.name = "Scene1";

      // Perspective Camera
      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        2000
      );
      camera.position.set(600, 400, 0);
      camera.name = "PerspectiveCamera";
      scene1.add(camera);

      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      ambientLight.name = "AmbientLight";
      scene1.add(ambientLight);

      // DirectLight
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.target.position.set(0, 0, -1);
      dirLight.add(dirLight.target);
      dirLight.lookAt(-1, -1, 0);
      dirLight.name = "DirectionalLight";
      scene1.add(dirLight);

      //get deminions
      let x, y, z;
      let areaMax = 0;
      let areaMin = Infinity;

      //loadTextures
      let loadedTextures = [];
      const loadTexture = async (i) => {
        return new Promise((reslove) => {
          let image = new Image();
          image.src = textures[i];
          image.onload = function () {
            let texture = new THREE.Texture();
            texture.needsUpdate = true;
            texture.image = image;
            const w = parseFloat(this.width);
            const h = parseFloat(this.height);
            let tempArea = w * h;
            if (tempArea > areaMax) {
              areaMax = tempArea;
              x = w > h ? w : h;
              y = w > h ? h : w;
            }
            if (tempArea < areaMin) {
              areaMin = tempArea;
              z = w > h ? h : w;
            }

            reslove(texture);
          };
        });
      };

      //load all textures as images
      for (let index = 0; index < 6; index++) {
        const loadedTexture = await loadTexture(index);
        loadedTextures.push(loadedTexture);
      }
      const textureCubeCustom = loadedTextures.map(
        (texture) =>
          new THREE.MeshBasicMaterial({
            map: texture,
          })
      );

      //cuboid
      object = new THREE.Mesh(
        new THREE.BoxGeometry(x, y, z),
        textureCubeCustom
      );
      object.position.set(0, 0, 0);
      object.name = "Cube";
      scene1.add(object);

      // camera
      const cameraOrtho = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        0.1,
        10
      );
      scene1.add(cameraOrtho);
      cameraOrtho.name = "OrthographicCamera";

      //export the scene
      exportGLTF(scene1);
    }
  };

  useEffect(() => console.log(textures), [textures]);

  return (
    <div className="App">
      <Modal open={openSnippet} onClose={handleCloseSnippet}>
        <Face
          img={textures[textures.length - 1]}
          remove={() => {
            setTextures((old) => old.slice(undefined, -2));
            handleCloseSnippet();
          }}
          approve={() => handleCloseSnippet()}
        />
      </Modal>
      <div
        className="header"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div>ManageArtworks</div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div>Faces Obtained- {textures.length} / 6</div>{" "}
          <PreviewPopup
            textures={textures}
            removeTexture={removeTexture}
            approveTexture={null}
          />
          <Button variant="contained" onClick={() => exportModel(textures)}>
            Convert
          </Button>
        </div>
      </div>
      <div className="webviewer" ref={viewer}></div>
      {/* <div className="webviewer" ref={viewer}></div> */}
    </div>
  );
}

export default App;
