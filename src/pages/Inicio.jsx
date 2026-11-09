import React from "react";
import { Link } from "react-router-dom";
import "../styles/inicio.css";


function Inicio(){

    return(

        <div className="pantalla-inicio">


            <div className="panel-inicio">


                <div className="icono-inventario">
                    📦
                </div>


                <h1>
                    Sistema de Gestión
                    <br/>
                    de Inventario
                </h1>



                <p>
                    Administra productos,
                    entradas, salidas,
                    proveedores y usuarios
                    de forma fácil y segura.
                </p>



                <div className="acciones">


                    <Link to="/login">

                        <button className="boton-azul">
                            Iniciar Sesión
                        </button>

                    </Link>



                    <Link to="/nuevo-usuario">

                        <button className="boton-verde">
                            Registrar Usuario
                        </button>

                    </Link>


                </div>



                <footer>
                    Sistema Inventario Online
                    <br/>
                    © 2026
                </footer>


            </div>


        </div>

    );

}


export default Inicio;