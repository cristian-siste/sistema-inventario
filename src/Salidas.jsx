import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { obtenerSalidas } from "./services/api";


function Salidas(){


    const [salidas, setSalidas] = useState([]);



    useEffect(()=>{

        cargarSalidas();

    },[]);



    const cargarSalidas = async()=>{

        try{

            const datos = await obtenerSalidas();


            console.log(
                "Salidas recibidas:",
                datos
            );


            setSalidas(datos);


        }catch(error){

            console.error(
                "Error cargando salidas:",
                error
            );

        }

    };



    return(

        <div className="contenedor">


            <div className="header-pagina">


                <h1>
                    Salidas
                </h1>


                <Link
                    to="/nueva-salida"
                    className="btn"
                >
                    Nueva Salida
                </Link>


            </div>



            <div className="tabla-contenedor">


                <table>


                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Producto</th>

                            <th>Cantidad</th>

                            <th>Fecha</th>

                            <th>Acciones</th>

                        </tr>

                    </thead>



                    <tbody>


                    {
                        salidas.map((salida)=>(


                            <tr key={salida.id}>


                                <td>
                                    {salida.id}
                                </td>


                                <td>
                                    {salida.producto}
                                </td>


                                <td>
                                    {salida.cantidad}
                                </td>


                                <td>
                                    {salida.fecha}
                                </td>


                                <td>


                                    <Link
                                        to={`/editar-salida/${salida.id}`}
                                        className="btn-editar"
                                    >
                                        Editar
                                    </Link>


                                    <button
                                        className="btn-eliminar"
                                    >
                                        Eliminar
                                    </button>


                                </td>


                            </tr>


                        ))
                    }


                    </tbody>


                </table>


            </div>


        </div>

    );

}


export default Salidas;