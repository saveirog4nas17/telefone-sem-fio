
import React from "react";

import { useWindowSize } from "./helpers";
import type { Brush } from "./model";

import Dialog from "./Dialog";
import ColorPicker from "./ColorPicker";

import helpImg from "./img/help.svg";
import checkImg from "./img/check.svg";
import colorwheelImg from "./img/colorwheel.svg";

const DrawTools = ({
  color,
  brushes,
  selectedBrush,
  triggerHelp,
  onSelectBrush,
  onChangeColor,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  onDone,
  isFill,
  onToggleFill,
  isEraser,
  onToggleEraser,
}: {
  color: string;
  brushes: Brush[];
  selectedBrush: Brush;
  triggerHelp: () => void;
  onSelectBrush: (brushIndex: number) => void;
  onChangeColor: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  onDone: () => void;
  isFill: boolean;
  onToggleFill: () => void;
  isEraser: boolean;
  onToggleEraser: () => void;
}) => {
  const brushButtonRef = React.useRef<HTMLDivElement>(null);
  const brushPopupRef = React.useRef<HTMLDivElement>(null);

  const [showBrushPopup, setShowBrushPopup] = React.useState(false);

  const selectBrush = () => {
    setShowBrushPopup(!showBrushPopup);
  };

  const windowSize = useWindowSize();

  React.useEffect(() => {
    const setBrushPopupPosition = () => {
      if (brushPopupRef.current !== null && brushButtonRef.current !== null) {
        brushPopupRef.current.style.left = `${
          brushButtonRef.current.offsetLeft +
          brushButtonRef.current.offsetWidth
        }px`;

        brushPopupRef.current.style.top =
          `calc(${brushButtonRef.current.offsetTop}px - 2vmin)`;
      }
    };

    setBrushPopupPosition();
  }, [windowSize, brushButtonRef, brushPopupRef]);

  const handleSelectBrush = (index: number) => {
    setShowBrushPopup(false);
    onSelectBrush(index);
  };

  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const triggerColorPicker = () => {
    setShowColorPicker(true);
  };

  const handlePickColor = (newColor: string) => {
    onChangeColor(newColor);
    setShowColorPicker(false);
  };

  return (
    <div className="Draw-tools">
      <div
        className="tool-button tool-button-help"
        onClick={triggerHelp}
      >
        <img
          src={helpImg}
          alt="Ajuda"
          title="Ajuda (mostrar o texto para desenhar)"
        />
      </div>

      <BrushButton
        size={selectedBrush.displaySize}
        color={color}
        onClick={selectBrush}
        ref={brushButtonRef}
      />

      <div
        className={"tool-popup" + (showBrushPopup ? "" : " hidden")}
        ref={brushPopupRef}
      >
        {brushes.map((brush, index) => (
          <BrushButton
            // eslint-disable-next-line @eslint-react/no-array-index-key -- static brush list, index is stable
            key={index}
            size={brush.displaySize}
            color={color}
            onClick={() => handleSelectBrush(index)}
          />
        ))}
      </div>

      <div className="tool-color" onClick={triggerColorPicker}>
        <div
          className="tool-color-selectedcolor"
          style={{ backgroundColor: color }}
        ></div>
        <img
          src={colorwheelImg}
          alt="Escolher cor"
          title="Escolher cor"
        />
      </div>

      <Dialog show={showColorPicker}>
        <ColorPicker handlePickColor={handlePickColor} />
      </Dialog>

      <button
        type="button"
        className="tool-button"
        onClick={onToggleEraser}
        title={isEraser ? "Voltar ao pincel" : "Usar borracha"}
        aria-label={isEraser ? "Selecionar pincel" : "Selecionar borracha"}
        aria-pressed={isEraser}
        style={{
          fontSize: "3.5vmin",
          cursor: "pointer",
          border: isEraser ? "0.5vmin solid #4287f5" : undefined,
          backgroundColor: isEraser ? "#dceaff" : undefined,
        }}
      >
        {isEraser ? "✏️" : "🧽"}
</button>


      <button
        type="button"
        className="tool-button"
        onClick={onToggleFill}
        title={isFill ? "Voltar ao pincel" : "Preencher com cor"}
        aria-label={isFill ? "Desativar balde" : "Balde de tinta"}
        aria-pressed={isFill}
        style={{
          backgroundColor: isFill ? "#dceaff" : "#281bdb",
          color: isFill ? "#281bdb" : "#ffffff",
          border: isFill ? "0.4vmin solid #4287f5" : "none",
          fontSize: "clamp(18px, 2.5vmin, 28px)",
          cursor: "pointer",
        }}
      >
        <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "55%", height: "55%" }}
  >
    <path d="m2 12 10-10 9 9-10 10z" />
    <path d="m7 7 10 10" />
    <path d="M2 17h19" />
    <path d="M19 19c0 1.1.9 2 2 2s2-.9 2-2-2-3-2-3-2 1.9-2 3z" />
  </svg>
      </button>


      <button
        type="button"
        className="tool-button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Desfazer último traço"
        aria-label="Desfazer"
        style={{
          opacity: canUndo ? 1 : 0.35,
          cursor: canUndo ? "pointer" : "not-allowed",
          fontSize: "4vmin",
          fontWeight: "bold",
        }}
      >
        ↶
      </button>

      <button
        type="button"
        className="tool-button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Refazer último traço"
        aria-label="Refazer"
        style={{
          opacity: canRedo ? 1 : 0.35,
          cursor: canRedo ? "pointer" : "not-allowed",
          fontSize: "4vmin",
          fontWeight: "bold",
        }}
      >
        ↷
      </button>

      
      <button
        type="button"
        className="tool-button"
        onClick={onClear}
        title="Limpar todo o desenho"
        aria-label="Limpar desenho"
        style={{
          backgroundColor: "#dc2626",
          fontSize: "clamp(18px, 2.5vmin, 28px)",
          cursor: "pointer",
        }}
      >
        🗑
      </button>


      <div
        className="tool-button tool-button-done"
        onClick={onDone}
      >
        <img
          src={checkImg}
          alt="Concluir desenho"
          title="Concluir desenho"
        />
      </div>
    </div>
  );
};

export default DrawTools;

const BrushButton = ({
  color,
  size,
  onClick,
  ref,
}: {
  color: string;
  size: number;
  onClick: () => void;
  ref?: React.Ref<HTMLDivElement>;
}) => {
  return (
    <div
      className="tool-button tool-button-brush"
      onClick={onClick}
      ref={ref}
      style={{ backgroundColor: color === "#FFF" ? "#aaa" : "white" }}
    >
      <div
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      ></div>
    </div>
  );
};
