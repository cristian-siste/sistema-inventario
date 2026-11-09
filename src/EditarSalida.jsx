import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";


function EditarSalida(){


    const { id } = useParams();

    const navigate = useNavigate();



    const salidasGuardadas =

    JSON.parse(localStorage.getItem("salidas")) || [];



    const salidaActual = salidasGuardadas.find(

        salida => salida.id === Number(id)

    );





    const [salida,setSalida] = useState({

        producto: salidaActual?.producto || "",

        cantidad: salidaActual?.cantidad || "",

        fecha: salidaActual?.fecha || "",

        usuario: salidaActual?.usuario || "",

        observacion: salidaActual?.observacion || ""

    });







    const cambiarDato=(e)=>{


        setSalida({

            ...salida,

            [e.target.name]:e.target.value

        });


    };








    const actualizarSalida=(e)=>{


        e.preventDefault();




        const nuevaLista = salidasGuardadas.map(item=>{


            if(item.id === Number(id)){


                return{

                    ...item,

                    producto:salida.producto,

                    cantidad:Number(salida.cantidad),

                    fecha:salida.fecha,

                    usuario:salida.usuario,

                    observacion:salida.observacion

                };


            }


            return item;


        });





        localStorage.setItem(

            "salidas",

            JSON.stringify(nuevaLista)

        );




        window.dispatchEvent(

            new Event("datosActualizados")

        );



        alert("Salida actualizada correctamente");



        navigate("/salidas");


    };








return(

<div className="contenedor">


<h1>
✏️ Editar Salida
</h1>




<form

className="formulario-salida"

onSubmit={actualizarSalida}

>




<label>
Producto
</label>


<input

type="text"

name="producto"

value={salida.producto}

onChange={cambiarDato}

/>





<label>
Cantidad
</label>


<input

type="number"

name="cantidad"

value={salida.cantidad}

onChange={cambiarDato}

/>





<label>
Fecha
</label>


<input

type="date"

name="fecha"

value={salida.fecha}

onChange={cambiarDato}

/>






<label>
Usuario responsable
</label>


<input

type="text"

name="usuario"

value={salida.usuario}

onChange={cambiarDato}

/>






<label>
Observación
</label>


<textarea

name="observacion"

value={salida.observacion}

onChange={cambiarDato}

/>





<button type="submit">

Actualizar Salida

</button>



</form>



</div>

);


}


export default EditarSalida;