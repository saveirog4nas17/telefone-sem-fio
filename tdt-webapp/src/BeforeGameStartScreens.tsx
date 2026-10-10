
import React from "react";

import type { PlayerInfo } from "./model";
import Player from "./Player";
import Logo from "./Logo";

import "./BeforeGameStartScreens.css";

export const WaitForPlayersScreen = ({
  gameId,
  players,
  handleStart,
}: {
  gameId: string;
  players: PlayerInfo[];
  handleStart: () => void;
}) => {
  const buttonDisabled = players.length <= 1;

  const link = window.location.toString();

  return (
    <BeforeGameStartScreen players={players}>
      <Logo />
      <div>Convide seus amigos para entrar na sala:</div>
      <div>
        <div className="field-label">Código da sala:</div>
        <div className="field">{gameId}</div>
      </div>
      <div>
        <div className="field-label">Link de convite:</div>
        <div className="field">{link}</div>
      </div>
      <div className="buttons">
        <button
          type="button"
          className="button"
          disabled={buttonDisabled}
          title={
            buttonDisabled
              ? "Aguardando mais jogadores"
              : "Tudo pronto! Vamos começar!"
          }
          onClick={handleStart}
        >
          Iniciar partida
        </button>
      </div>
      <div className="small">
        Número mínimo de jogadores: 3. Quanto mais gente, mais diversão!
        <br />
        Depois que a partida começar, novos jogadores não poderão entrar.
      </div>
    </BeforeGameStartScreen>
  );
};

export const WaitForGameStartScreen = ({
  players,
}: {
  players: PlayerInfo[];
}) => {
  const creator = players.find((p) => p.isCreator)!;

  return (
    <BeforeGameStartScreen players={players}>
      <div>Aguardando {creator.name} iniciar a partida.</div>
    </BeforeGameStartScreen>
  );
};

const BeforeGameStartScreen = ({
  players,
  children,
}: {
  players: PlayerInfo[];
  children: React.ReactNode;
}) => {
  return (
    <div className="BeforeGameStartScreen">
      <div className="BeforeGameStartScreen-left">
        <div className="Players-title">Jogadores:</div>
        <div className="Players">
          {players.map((player, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- PlayerInfo has no unique id
            <Player key={index} face={player.face}>
              {player.name}
            </Player>
          ))}
        </div>
      </div>
      <div className="BeforeGameStartScreen-right">{children}</div>
    </div>
  );
};

export default WaitForPlayersScreen;
