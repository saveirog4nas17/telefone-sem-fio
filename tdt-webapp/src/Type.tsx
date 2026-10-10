
import React from "react";

import { isBlank } from "./helpers";
import Scrollable from "./Scrollable";
import type { PlayerInfo } from "./model";

import "./Type.css";

import typeImg from "./img/type.svg";

const Type = ({
  round,
  rounds,
  drawingSrc,
  artist,
  handleDone,
}: {
  round: number;
  rounds: number;
  drawingSrc: string | null;
  artist: PlayerInfo | null;
  handleDone: (text: string) => void;
}) => {
  const [text, setText] = React.useState("");

  const buttonDisabled = isBlank(text);

  const first = drawingSrc === null;

  return (
    <Scrollable>
      <div className="Type">
        <div>
          <div className="small">
            Rodada {round} de {rounds}
          </div>
          <h1>
            <img src={typeImg} alt="Escrever" />
          </h1>
          <div>
            {first
              ? "... uma frase ou uma pequena história:"
              : "... o que você vê no desenho abaixo:"}
          </div>
        </div>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
        />
        {first && (
          <div className="small">
            O próximo jogador terá que desenhar o que você escreveu.
          </div>
        )}
        {!first && (
          <div>
            Desenho de {artist!.name}:
            <img src={drawingSrc!} className="Drawing" alt="Desenho" />
          </div>
        )}
        <button
          type="button"
          className="button"
          disabled={buttonDisabled}
          onClick={() => handleDone(text.trim())}
        >
          Concluir
        </button>
      </div>
    </Scrollable>
  );
};

export default Type;
