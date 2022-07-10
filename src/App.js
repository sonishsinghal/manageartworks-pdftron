import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import WebViewer from "@pdftron/webviewer";
import "./App.css";
import Popup from "reactjs-popup";

function App() {
  const viewer = useRef(null);
  const [textures, setTextures] = useState([]);

  const PopupExample = ({ imageURL }) => (
    <Popup trigger={<button> Trigger</button>} position="right center">
      <img src={imageURL} alt="preview"></img>
    </Popup>
  );
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
        initialDoc:
          "https://pdftron.s3.amazonaws.com/downloads/pl/demo-annotated.pdf",
        enableFilePicker: true, // enable FILE SYSTEM
      },
      viewer.current
    ).then((instance) => {
      // sniping tool code
      const {
        docViewer,
        Annotations,
        Tools,
        iframeWindow,
        annotManager,
      } = instance;

      const createSnipTool = function() {
        const SnipTool = function() {
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
        PopupExample({ imageURL });

        //add to texture state if the snippet is correct
        setTextures((pre) => [...pre, imageURL]);

        //downloadURI(copyCanvas.toDataURL(), "sample.jpeg");

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
        function(result) {
          if (result instanceof ArrayBuffer) {
            saveArrayBuffer(result, "scene.glb");
          } else {
            const output = JSON.stringify(result, null, 2);
            console.log(output);
            saveString(output, "scene.gltf");
          }
        },
        function(error) {
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

    await init();

    async function init() {
      scene1 = new THREE.Scene();
      scene1.name = "Scene1";

      // ---------------------------------------------------------------------
      // Perspective Camera
      // ---------------------------------------------------------------------
      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        2000
      );
      camera.position.set(600, 400, 0);

      camera.name = "PerspectiveCamera";
      scene1.add(camera);

      // ---------------------------------------------------------------------
      // Ambient light
      // ---------------------------------------------------------------------
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      ambientLight.name = "AmbientLight";
      scene1.add(ambientLight);

      // ---------------------------------------------------------------------
      // DirectLight
      // ---------------------------------------------------------------------
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.target.position.set(0, 0, -1);
      dirLight.add(dirLight.target);
      dirLight.lookAt(-1, -1, 0);
      dirLight.name = "DirectionalLight";
      scene1.add(dirLight);

      //custom texture on every side
      const textureLoader = new THREE.TextureLoader();
      const textureCubeCustom = [
        new THREE.MeshBasicMaterial({
          map: textureLoader.load(textures[0]),
        }),
        new THREE.MeshBasicMaterial({
          map: textureLoader.load(textures[1]),
        }),
        new THREE.MeshBasicMaterial({
          map: textureLoader.load(textures[2]),
        }),
        new THREE.MeshBasicMaterial({
          map: textureLoader.load(textures[3]),
        }),
        new THREE.MeshBasicMaterial({
          map: textureLoader.load(textures[4]),
        }),
        new THREE.MeshBasicMaterial({
          map: textureLoader.load(textures[5]),
        }),
      ];

      object = new THREE.Mesh(
        new THREE.BoxGeometry(359, 111, 111),
        textureCubeCustom
      );
      object.position.set(0, 0, 0);
      object.name = "Cube";
      scene1.add(object);

      // ---------------------------------------------------------------------
      // camera
      // ---------------------------------------------------------------------
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

  return (
    <div className="App">
      <div className="header">ManageArtworks </div>
      <div className="webviewer" ref={viewer}></div>
      <button onClick={exportModel}>Export glb</button>
      {/* <div className="webviewer" ref={viewer}></div> */}
  </div>
  );
}

export default App;
