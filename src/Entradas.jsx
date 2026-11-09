
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Importar las funciones de la API desde src/services/api.js.
import {
    obtenerEntradas,
    eliminarEntrada
} from "./services/api";

function Entradas() {
    // Guardar las entradas recibidas desde el backend.
    const [entradas, setEntradas] = useState([]);

    // Consultar las entradas cuando se abre la página.
    useEffect(() => {
        cargarEntradas();
    }, []);

    // Obtener y mostrar las entradas registradas.
    const cargarEntradas = async () => {
        try {
            const datos = await obtenerEntradas();
            console.log("Entradas recibidas:", datos);
            setEntradas(datos);
        } catch (error) {
            console.error("Error cargando entradas:", error);
            alert("No se pudieron cargar las entradas. Revisa la consola.");
        }
    };

    // Eliminar una entrada después de confirmar la acción.
    const manejarEliminar = async (id) => {
        const confirmar = window.confirm(
            "¿Estás seguro de que deseas eliminar la entrada #" + id + "?"
        );

        if (!confirmar) {
            return;
        }

        try {
            // Enviar el ID al backend para eliminar el registro.
            await eliminarEntrada(id);

            alert("La entrada se eliminó correctamente.");

            // Actualizar la tabla después de eliminar.
            await cargarEntradas();
        } catch (error) {
            console.error("Error eliminando la entrada:", error);
            alert("No se pudo eliminar la entrada: " + error.message);
        }
    };

    return (
        <div className="contenedor">
            <div className="header-pagina">
                <h1>Entradas</h1>

                <Link to="/nueva-entrada" className="btn">
                    Nueva Entrada
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
                        {entradas.length > 0 ? (
                            entradas.map((entrada) => (
                                <tr key={entrada.id}>
                                    <td>{entrada.id}</td>
                                    <td>{entrada.producto}</td>
                                    <td>{entrada.cantidad}</td>
                                    <td>{entrada.fecha}</td>
                                    <td>
                                        <Link
                                            to={`/editar-entrada/${entrada.id}`}
                                            className="btn-editar"
                                        >
                                            Editar
                                        </Link>

                                        <button
                                            type="button"
                                            className="btn-eliminar"
                                            onClick={() =>
                                                manejarEliminar(entrada.id)
                                            }
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">
                                    No hay entradas registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Entradas;
