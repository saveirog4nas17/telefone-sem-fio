
import styled from "styled-components";

import NewlineToBreak from "./NewLineToBreak";
import type { PlayerInfo } from "./model";
import Dialog from "./Dialog";
import Scrollable from "./Scrollable";

import drawImg from "./img/draw.svg";

export const ConfirmDrawingDialog = ({
  text,
  show,
  drawingDataUrl,
  handleDone,
  handleContinue,
}: {
  text: string;
  show: boolean;
  drawingDataUrl?: string;
  handleDone: () => void;
  handleContinue: () => void;
}) => {
  return (
    <Dialog show={show}>
      <ConfirmDrawingDialogContent>
        <h1>Terminou seu desenho?</h1>
        <Text className="ConfirmDrawingDialogContent-text">
          {NewlineToBreak(text)}
        </Text>
        <div>
          <img src={drawingDataUrl} alt="Desenho" />
        </div>
        <div className="buttons">
          <button type="button" className="button" onClick={handleDone}>
            Sim, terminei!
          </button>
          <button
            type="button"
            className="button button-red"
            onClick={handleContinue}
          >
            Não, continuar desenhando
          </button>
        </div>
      </ConfirmDrawingDialogContent>
    </Dialog>
  );
};

const ConfirmDrawingDialogContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;

  img {
    border: 0.7vmin solid black;
    border-radius: 2vmin;
    max-height: 50vh;
    max-width: 80%;
  }

  .ConfirmDrawingDialogContent-text {
    flex-shrink: 1;
    max-height: fit-content;
  }
`;

export const DrawHelpDialog = ({
  text,
  textWriter,
  round,
  rounds,
  show,
  firstShow,
  handleClose,
}: {
  text: string;
  textWriter: PlayerInfo;
  round: number;
  rounds: number;
  show: boolean;
  firstShow: boolean;
  handleClose: () => void;
}) => {
  return (
    <Dialog show={show}>
      <Scrollable>
        <div className="DrawHelp">
          <div>
            <div className="small">
              Rodada {round} de {rounds}
            </div>
            <h1>
              <img src={drawImg} alt="Desenhar" />
            </h1>
            <div>... o texto de {textWriter.name}:</div>
          </div>
          <Text>{NewlineToBreak(text)}</Text>
          <button type="button" className="button" onClick={handleClose}>
            {firstShow ? "Começar a desenhar" : "Continuar desenhando"}
          </button>
        </div>
      </Scrollable>
    </Dialog>
  );
};

const Text = styled.div`
  border-radius: 2vmin;
  padding: 1vmin 2vmin;
  background-color: #def5ff;
  width: 90%;
  box-shadow: 0 0 1vmin #def5ff;
  margin: 2vmin 0;
  word-break: break-word;
  overflow-wrap: anywhere;
  overflow: auto;
`;
