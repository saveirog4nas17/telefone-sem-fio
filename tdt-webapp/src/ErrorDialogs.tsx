
import styled from "styled-components";

import Dialog from "./Dialog";

const ConnectionLostErrorDialogContent = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;

  h1 {
    color: red;
  }
`;

export const ConnectionLostErrorDialog = ({
  show,
  handleReconnect,
}: {
  show: boolean;
  handleReconnect: () => void;
}) => {
  return (
    <Dialog show={show} highPriority={true}>
      <ConnectionLostErrorDialogContent>
        <div></div>
        <h1>ERRO</h1>
        <div>Conexão com o servidor perdida.</div>
        <button type="button" className="button" onClick={handleReconnect}>
          Tentar reconectar
        </button>
      </ConnectionLostErrorDialogContent>
    </Dialog>
  );
};
