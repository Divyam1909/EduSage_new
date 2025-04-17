import React from 'react';
import styled from 'styled-components';

const AILoader = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <span />
      </div>
      <p className="loading-text">AI is parsing your calendar...</p>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 1rem;

  .loading-text {
    color: #6b21a8;
    font-weight: 500;
    margin-top: 1rem;
    font-size: 0.9rem;
    text-align: center;
  }

  .loader {
    position: relative;
    width: 120px;
    height: 120px;
    background: transparent;
    border-radius: 50%;
    box-shadow: 25px 25px 75px rgba(0,0,0,0.25);
    border: 1px solid #6b21a8;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .loader::before {
    content: '';
    position: absolute;
    inset: 20px;
    background: transparent;
    border: 1px dashed #8b5cf6;
    border-radius: 50%;
    box-shadow: inset -5px -5px 25px rgba(107,33,168,0.15),
    inset 5px 5px 35px rgba(107,33,168,0.15);
  }

  .loader::after {
    content: '';
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 1px dashed #8b5cf6;
    box-shadow: inset -5px -5px 25px rgba(107,33,168,0.15),
    inset 5px 5px 35px rgba(107,33,168,0.15);
  }

  .loader span {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50%;
    height: 100%;
    background: transparent;
    transform-origin: top left;
    animation: radar81 2s linear infinite;
    border-top: 3px dashed #8b5cf6;
  }

  .loader span::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #9333ea;
    transform-origin: top left;
    transform: rotate(-55deg);
    filter: blur(30px) drop-shadow(20px 20px 20px #6b21a8);
  }

  @keyframes radar81 {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`;

export default AILoader; 