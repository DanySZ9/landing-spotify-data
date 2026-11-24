import { Component } from "react";

// Si algo falla al cargar o dibujar, muestra el aviso en lugar de dejar la página en blanco.
export default class LimiteError extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  render() {
    return this.state.fallo ? this.props.aviso : this.props.children;
  }
}
