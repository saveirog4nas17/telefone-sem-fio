
import React from "react";

import { toggleToFullscreenAndLandscapeOnMobile } from "./helpers";
import type { PlayerInfo, Brush } from "./model";

import { ConfirmDrawingDialog, DrawHelpDialog } from "./DrawDialogs";
import DrawCanvas, { type ImageProvider } from "./DrawCanvas";
import DrawTools from "./DrawTools";

import "./Draw.css";

function getBrushes(scale: number): Brush[] {
  const sizes = [2, 8, 16, 32, 64];
  return sizes.map((size) => ({
    pixelSize: size,
    displaySize: Math.ceil(size * scale),
  }));
}

const Draw = ({
  text,
  textWriter,
  round,
  rounds,
  handleDone,
}: {
  text: string;
  textWriter: PlayerInfo;
  round: number;
  rounds: number;
  handleDone: (image: Blob) => void;
}) => {
  const [showHelpDialog, setShowHelpDialog] = React.useState(true);
  const [firstTimeHelpDialog, setFirstTimeHelpDialog] = React.useState(true);

  const [color, setColor] = React.useState("#000");

  const [isEraser, setIsEraser] = React.useState(false);
  const [isFill, setIsFill] = React.useState(false);

  const activeColor = isEraser ? "#FFFFFF" : color;
  
  const [brushes, setBrushes] = React.useState(() => getBrushes(1));
  const [selectedBrushIndex, setSelectedBrushIndex] = React.useState(1);

  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  const imageProviderRef = React.useRef<ImageProvider>(null);

  const selectedBrush: Brush = brushes[selectedBrushIndex];

  const handleSelectBrush = (brushIndex: number) => {
    setSelectedBrushIndex(brushIndex);
  };

  const handleScaleChange = React.useCallback((scale: number) => {
    setBrushes(getBrushes(scale));
  }, []);

  const handleHistoryChange = React.useCallback(
    (undoAvailable: boolean, redoAvailable: boolean) => {
      setCanUndo(undoAvailable);
      setCanRedo(redoAvailable);
    },
    [],
  );

  const handleUndo = () => {
    imageProviderRef.current?.undo();
  };

  const handleRedo = () => {
    imageProviderRef.current?.redo();
  };

  const handleClear = () => {
  const confirmed = window.confirm(
    "Deseja apagar todo o desenho?\n\nVocê poderá recuperá-lo usando o botão Desfazer.",
  );

  if (confirmed) {
    imageProviderRef.current?.clear();
  }
  };

  const [showConfirmDialog, setShowConfirmDialog] =
    React.useState(false);

  const [drawingDataUrl, setDrawingDataUrl] = React.useState<
    string | undefined
  >();

  const handleClickDone = () => {
    const imageProvider = imageProviderRef.current!;
    const imageDataUrl = imageProvider.getImageDataURL();

    setDrawingDataUrl(imageDataUrl);
    setShowConfirmDialog(true);
  };

  const handleConfirmDone = () => {
    window
      .fetch(drawingDataUrl!)
      .then((res) => res.blob())
      .then((image) => handleDone(image));

    setShowConfirmDialog(false);
  };

  const handleContinueDrawing = () => {
    setShowConfirmDialog(false);
    setDrawingDataUrl(undefined);
  };

  const handleCloseHelpDialog = () => {
    setShowHelpDialog(false);
    setFirstTimeHelpDialog(false);
    toggleToFullscreenAndLandscapeOnMobile();
  };

  return (
    <div className="Draw">
      <ConfirmDrawingDialog
        text={text}
        show={showConfirmDialog}
        drawingDataUrl={drawingDataUrl}
        handleDone={handleConfirmDone}
        handleContinue={handleContinueDrawing}
      />

      <DrawHelpDialog
        text={text}
        textWriter={textWriter}
        round={round}
        rounds={rounds}
        show={showHelpDialog}
        firstShow={firstTimeHelpDialog}
        handleClose={handleCloseHelpDialog}
      />


        <DrawTools
          color={activeColor}
          brushes={brushes}
          selectedBrush={selectedBrush}
          triggerHelp={() => setShowHelpDialog(true)}
          onSelectBrush={handleSelectBrush}
          onChangeColor={(newColor) => {
            setColor(newColor);
            setIsEraser(false);
          }}
          isEraser={isEraser}
          onToggleEraser={() => {
            setIsEraser((previous) => !previous);
            setIsFill(false);
          }}
          isFill={isFill}
          onToggleFill={() => {
            setIsFill((previous) => !previous);
            setIsEraser(false);
          }}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          canUndo={canUndo}
          canRedo={canRedo}
          onDone={handleClickDone}
        />


      <DrawCanvas
        color={activeColor}
        fillMode={isFill}
        brushPixelSize={selectedBrush.pixelSize}
        imageProviderRef={imageProviderRef}
        handleScaleChange={handleScaleChange}
        onHistoryChange={handleHistoryChange}
      />
    </div>
  );
};

export default Draw;
