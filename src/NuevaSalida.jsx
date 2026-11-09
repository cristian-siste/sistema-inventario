
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    obtenerProductos,
    obtenerUsuarios,
    crearSalida
} from "./services/api";

import "./NuevaSalida.css";

function NuevaSalida() {
    const navigate = useNavigate();

    const [productos, setProductos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const [salida, setSalida] = useState({
        producto: "",
        cantidad: "",
        fecha: "",
        usuario: "",
        observacion: ""
    });

    // Cargar productos y usuarios desde la API.
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setCargando(true);
                setError("");

                const respuestaProductos = await obtenerProductos();

                const listaProductos = Array.isArray(respuestaProductos)
                    ? respuestaProductos
                    : Array.isArray(respuestaProductos?.datos)
                    ? respuestaProductos.datos
                    : Array.isArray(respuestaProductos?.productos)
                    ? respuestaProductos.productos
                    : [];

                setProductos(listaProductos);

                const respuestaUsuarios = await obtenerUsuarios();

                const listaUsuarios = Array.isArray(respuestaUsuarios)
                    ? respuestaUsuarios
                    : Array.isArray(respuestaUsuarios?.datos)
                    ? respuestaUsuarios.datos
                    : Array.isArray(respuestaUsuarios?.usuarios)
                    ? respuestaUsuarios.usuarios
                    : [];

                setUsuarios(listaUsuarios);

                if (listaProductos.length === 0) {
                    setError(
                        "No hay productos disponibles. Verifica productos/listar.php."
                    );
                } else if (listaUsuarios.length === 0) {
                    setError(
                        "No se encontraron usuarios. Verifica usuarios/listar.php."
                    );
                }
            } catch (err) {
                console.error("Error cargando productos y usuarios:", err);

                setError(
                    err.message ||
                    "No fue posible cargar los productos y usuarios."
                );
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    // Actualizar los campos del formulario.
    const cambiarDato = (e) => {
        const { name, value } = e.target;

        setSalida((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    // Registrar la salida en PHP y MySQL.
    const guardarSalida = async (e) => {
        e.preventDefault();

        if (guardando) {
            return;
        }

        setError("");

        if (!salida.producto) {
            setError("Selecciona un producto.");
            return;
        }

        if (!salida.usuario) {
            setError("Selecciona el usuario responsable.");
            return;
        }

        if (!salida.cantidad || Number(salida.cantidad) <= 0) {
            setError("Ingresa una cantidad mayor que cero.");
            return;
        }

        if (!Number.isInteger(Number(salida.cantidad))) {
            setError("La cantidad debe ser un número entero.");
            return;
        }

        if (!salida.fecha) {
            setError("Selecciona la fecha de la salida.");
            return;
        }

        const productoSeleccionado = productos.find(
            (producto) =>
                String(producto.id) === String(salida.producto)
        );

        if (!productoSeleccionado) {
            setError("No se encontró el producto seleccionado.");
            return;
        }

        const cantidad = Number(salida.cantidad);
        const stockDisponible = Number(productoSeleccionado.stock);

        if (cantidad > stockDisponible) {
            setError(
                "Stock insuficiente. Unidades disponibles: " +
                stockDisponible
            );
            return;
        }

        try {
            setGuardando(true);

            // El PHP recibe estos tres campos.
            const datosSalida = {
                producto_id: Number(productoSeleccionado.id),
                cantidad: cantidad,
                fecha: salida.fecha
            };

            const respuesta = await crearSalida(datosSalida);

            if (
                respuesta?.error ||
                respuesta?.success === false
            ) {
                throw new Error(
                    respuesta.error ||
                    "No fue posible registrar la salida."
                );
            }

            alert(
                respuesta?.mensaje ||
                "Salida registrada correctamente."
            );

            // Ir a la pantalla que consulta salidas/listar.php.
            navigate("/salidas");
        } catch (err) {
            console.error("Error registrando salida:", err);

            setError(
                err.message ||
                "No se pudo registrar la salida. Verifica la conexión con PHP."
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="contenedor">
            <div className="header-pagina">
                <h1>⬆ Registrar Salida</h1>
            </div>

            {error && (
                <div
                    role="alert"
                    style={{
                        padding: "12px",
                        marginBottom: "16px",
                        color: "#b42332",
                        backgroundColor: "#fff0f0",
                        border: "1px solid #f2b8b8",
                        borderRadius: "6px"
                    }}
                >
                    {error}
                </div>
            )}

            <form
                className="formulario-salida"
                onSubmit={guardarSalida}
            >
                <label htmlFor="producto">
                    Producto
                </label>

                <select
                    id="producto"
                    name="producto"
                    value={salida.producto}
                    onChange={cambiarDato}
                    required
                    disabled={cargando || productos.length === 0 || guardando}
                >
                    <option value="">
                        {cargando
                            ? "Cargando productos..."
                            : productos.length === 0
                            ? "No hay productos disponibles"
                            : "Seleccione un producto"}
                    </option>

                    {productos.map((producto) => (
                        <option
                            key={producto.id}
                            value={String(producto.id)}
                            disabled={Number(producto.stock) <= 0}
                        >
                            {producto.nombre}
                            {" — Stock disponible: "}
                            {producto.stock}
                        </option>
                    ))}
                </select>

                <label htmlFor="cantidad">
                    Cantidad
                </label>

                <input
                    id="cantidad"
                    type="number"
                    name="cantidad"
                    min="1"
                    step="1"
                    max={
                        productos.find(
                            (producto) =>
                                String(producto.id) === String(salida.producto)
                        )?.stock ?? undefined
                    }
                    value={salida.cantidad}
                    onChange={cambiarDato}
                    placeholder="Ingrese la cantidad"
                    required
                    disabled={cargando || guardando}
                />

                <label htmlFor="fecha">
                    Fecha de salida
                </label>

                <input
                    id="fecha"
                    type="date"
                    name="fecha"
                    value={salida.fecha}
                    onChange={cambiarDato}
                    required
                    disabled={guardando}
                />

                <label htmlFor="usuario">
                    Usuario responsable
                </label>

                <select
                    id="usuario"
                    name="usuario"
                    value={salida.usuario}
                    onChange={cambiarDato}
                    required
                    disabled={cargando || usuarios.length === 0 || guardando}
                >
                    <option value="">
                        {cargando
                            ? "Cargando usuarios..."
                            : usuarios.length === 0
                            ? "No hay usuarios disponibles"
                            : "Seleccione el usuario responsable"}
                    </option>

                    {usuarios.map((usuario) => (
                        <option
                            key={usuario.id}
                            value={String(usuario.id)}
                        >
                            {usuario.nombre}
                        </option>
                    ))}
                </select>

                <label htmlFor="observacion">
                    Observación
                </label>

                <textarea
                    id="observacion"
                    name="observacion"
                    value={salida.observacion}
                    onChange={cambiarDato}
                    placeholder="Escriba una observación"
                    rows="4"
                    disabled={guardando}
                />

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "15px",
                        flexWrap: "wrap"
                    }}
                >
                    <button
                        type="submit"
                        disabled={
                            cargando ||
                            guardando ||
                            productos.length === 0 ||
                            usuarios.length === 0
                        }
                    >
                        {guardando
                            ? "Guardando salida..."
                            : "Guardar Salida"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/salidas")}
                        disabled={guardando}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}

export default NuevaSalida;
