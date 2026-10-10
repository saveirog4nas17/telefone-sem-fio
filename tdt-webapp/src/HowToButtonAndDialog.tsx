
import React from "react";
import styled from "styled-components";

import Dialog from "./Dialog";
import Scrollable from "./Scrollable";

const HowToButtonAndDialog = () => {
  const [showHowToDialog, setShowHowToDialog] = React.useState(false);

  return (
    <>
      <Dialog show={showHowToDialog}>
        <Scrollable>
          <HowToDialogContent>
            <h1>Como jogar?</h1>
            <div className="HowToDialogContent-text">
              <em>Telefone Sem Fio</em> é um jogo divertido que mistura
              criatividade, desenhos e muitas risadas! É perfeito para
              jogar com os amigos. Imagine o clássico telefone sem fio,
              mas com desenhos no meio da brincadeira!
              <br />
              Funciona assim: cada jogador começa escrevendo uma frase.
              Essa frase é enviada para o próximo jogador, que precisa
              transformá-la em um desenho. Depois, o desenho passa para
              outra pessoa, que deve descrevê-lo com uma nova frase,
              sem saber o que foi escrito originalmente!
              Essa sequência de frases e desenhos continua até que
              todos tenham participado de cada história.
              <br />
              No final, todos descobrem como as histórias foram se
              transformando ao longo do jogo. Prepare-se para ver
              interpretações inesperadas e dar boas risadas!
              <br />
              <br />
              Número mínimo de jogadores: 3. Quanto mais gente, mais diversão!
            </div>
            <button
              type="button"
              className="button"
              onClick={() => setShowHowToDialog(false)}
            >
              Entendi, vamos jogar!
            </button>
          </HowToDialogContent>
        </Scrollable>
      </Dialog>
      <button
        type="button"
        className="button button-red"
        onClick={() => setShowHowToDialog(true)}
      >
        Como jogar?
      </button>
    </>
  );
};

export default HowToButtonAndDialog;

const HowToDialogContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;

  .HowToDialogContent-text {
    font-size: calc(14px + 2vmin);
    margin: 0 2vmin;
  }
`;
