
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./NuevaEntrada.css";

// Funciones para consultar y actualizar las entradas.
import {
    obtenerEntradas,
    actualizarEntrada
} from "./services/api";

// Direcciones de los servicios PHP.
const API_PRODUCTOS = "http://localhost/php-api/api/productos/listar.php";
const API_PROVEEDORES = "http://localhost/php-api/api/proveedores/listar.php";

function EditarEntrada() {
    // Obtener el identificador de la entrada desde la URL.
    const { id } = useParams();
    const navigate = useNavigate();

    // Datos de la entrada que se van a mostrar y editar.
    const [entrada, setEntrada] = useState({
        producto_id: "",
        cantidad: "",
        fecha: "",
        numero_comprobante: "",
        proveedor_id: "",
        costo_unitario: "",
        tipo_entrada: "Compra",
        estado: "Recibida",
        recibido_por: "",
        usuario: "",
        observacion: ""
    });

    // Catálogos para los campos desplegables.
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // Estados para controlar la carga, el guardado y los errores.
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    // Consultar la entrada, los productos y los proveedores.
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setCargando(true);
                setError("");

                // Consultar las entradas existentes.
                const entradas = await obtenerEntradas();

                // Buscar la entrada que corresponde al ID de la URL.
                const actual = entradas.find(
                    item => Number(item.id) === Number(id)
                );

                if (!actual) {
                    throw new Error(
                        "No se encontró la entrada seleccionada."
                    );
                }

                // Consultar productos y proveedores en paralelo.
                const [respuestaProductos, respuestaProveedores] =
                    await Promise.all([
                        fetch(API_PRODUCTOS),
                        fetch(API_PROVEEDORES)
                    ]);

                if (!respuestaProductos.ok) {
                    throw new Error("No se pudieron cargar los productos.");
                }

                if (!respuestaProveedores.ok) {
                    throw new Error("No se pudieron cargar los proveedores.");
                }

                const datosProductos = await respuestaProductos.json();
                const datosProveedores = await respuestaProveedores.json();

                // Admitir respuestas PHP en forma de arreglo u objeto.
                const listaProductos = Array.isArray(datosProductos)
                    ? datosProductos
                    : datosProductos.productos || [];

                const listaProveedores = Array.isArray(datosProveedores)
                    ? datosProveedores
                    : datosProveedores.proveedores || [];

                setProductos(listaProductos);
                setProveedores(listaProveedores);

                // Cargar los valores actuales de la entrada.
                // Los campos opcionales vacíos se convierten en cadenas vacías.
                setEntrada({
                    producto_id: String(actual.producto_id ?? ""),
                    cantidad: String(actual.cantidad ?? ""),
                    fecha: String(actual.fecha ?? "").slice(0, 10),
                    numero_comprobante: actual.numero_comprobante ?? "",
                    proveedor_id: actual.proveedor_id == null
                        ? ""
                        : String(actual.proveedor_id),
                    costo_unitario: actual.costo_unitario ?? "",
                    tipo_entrada: actual.tipo_entrada || "Compra",
                    estado: actual.estado || "Recibida",
                    recibido_por: actual.recibido_por ?? "",
                    usuario: actual.usuario ?? "",
                    observacion: actual.observacion ?? ""
                });

            } catch (err) {
                console.error("Error cargando la entrada:", err);
                setError(
                    err.message || "No se pudo cargar la información."
                );
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [id]);

    // Actualizar el valor del campo que el usuario modifica.
    const cambiarDato = (e) => {
        const { name, value } = e.target;

        setEntrada(anterior => ({
            ...anterior,
            [name]: value
        }));
    };

    // Validar los datos y enviarlos al servicio PHP.
    const guardarCambios = async (e) => {
        e.preventDefault();
        setError("");

        // Comprobar los campos obligatorios.
        if (
            !entrada.producto_id ||
            !entrada.cantidad ||
            Number(entrada.cantidad) <= 0 ||
            !entrada.fecha
        ) {
            setError(
                "Selecciona un producto, una cantidad válida y una fecha."
            );
            return;
        }

        // El costo puede estar vacío, pero no ser negativo.
        if (
            entrada.costo_unitario !== "" &&
            Number(entrada.costo_unitario) < 0
        ) {
            setError("El costo unitario no puede ser negativo.");
            return;
        }

        try {
            setGuardando(true);

            // Enviar todos los campos para evitar perder datos existentes.
            await actualizarEntrada(id, {
                producto_id: Number(entrada.producto_id),
                cantidad: Number(entrada.cantidad),
                fecha: entrada.fecha,
                numero_comprobante: entrada.numero_comprobante.trim(),
                proveedor_id: entrada.proveedor_id === ""
                    ? null
                    : Number(entrada.proveedor_id),
                costo_unitario: entrada.costo_unitario === ""
                    ? null
                    : Number(entrada.costo_unitario),
                tipo_entrada: entrada.tipo_entrada,
                estado: entrada.estado,
                recibido_por: entrada.recibido_por.trim(),
                usuario: entrada.usuario.trim(),
                observacion: entrada.observacion.trim()
            });

            alert("Entrada actualizada correctamente.");
            navigate("/entradas");

        } catch (err) {
            console.error("Error actualizando la entrada:", err);
            setError(
                err.message || "No se pudo actualizar la entrada."
            );
        } finally {
            setGuardando(false);
        }
    };

    // Mostrar un mensaje mientras se consultan los datos.
    if (cargando) {
        return (
            <div className="contenedor">
                <h1>Editar entrada</h1>
                <p>Cargando información de la entrada...</p>
            </div>
        );
    }

    return (
        <div className="contenedor">
            <h1>✏️ Editar entrada de inventario</h1>

            {error && (
                <p
                    role="alert"
                    style={{
                        color: "#b91c1c",
                        background: "#fee2e2",
                        padding: "12px",
                        borderRadius: "6px"
                    }}
                >
                    {error}
                </p>
            )}

            <form
                className="formulario-entrada"
                onSubmit={guardarCambios}
            >
                {/* Producto asociado a la entrada */}
                <label htmlFor="producto_id">Producto *</label>
                <select
                    id="producto_id"
                    name="producto_id"
                    value={entrada.producto_id}
                    onChange={cambiarDato}
                    required
                >
                    <option value="">Selecciona un producto</option>
                    {productos.map(producto => (
                        <option
                            key={producto.id}
                            value={String(producto.id)}
                        >
                            {producto.nombre}
                        </option>
                    ))}
                </select>

                {/* Cantidad recibida o registrada */}
                <label htmlFor="cantidad">Cantidad *</label>
                <input
                    id="cantidad"
                    type="number"
                    name="cantidad"
                    min="1"
                    step="1"
                    value={entrada.cantidad}
                    onChange={cambiarDato}
                    required
                />

                {/* Fecha de la operación */}
                <label htmlFor="fecha">Fecha *</label>
                <input
                    id="fecha"
                    type="date"
                    name="fecha"
                    value={entrada.fecha}
                    onChange={cambiarDato}
                    required
                />

                {/* Número de factura o comprobante */}
                <label htmlFor="numero_comprobante">
                    Número de comprobante
                </label>
                <input
                    id="numero_comprobante"
                    type="text"
                    name="numero_comprobante"
                    maxLength="30"
                    value={entrada.numero_comprobante}
                    onChange={cambiarDato}
                    placeholder="Ej. FAC-000123"
                />

                {/* Proveedor que entrega la mercancía */}
                <label htmlFor="proveedor_id">Proveedor</label>
                <select
                    id="proveedor_id"
                    name="proveedor_id"
                    value={entrada.proveedor_id}
                    onChange={cambiarDato}
                >
                    <option value="">Sin proveedor asignado</option>
                    {proveedores.map(proveedor => (
                        <option
                            key={proveedor.id}
                            value={String(proveedor.id)}
                        >
                            {proveedor.nombre}
                        </option>
                    ))}
                </select>

                {/* Costo unitario del producto */}
                <label htmlFor="costo_unitario">Costo unitario</label>
                <input
                    id="costo_unitario"
                    type="number"
                    name="costo_unitario"
                    min="0"
                    step="0.01"
                    value={entrada.costo_unitario}
                    onChange={cambiarDato}
                    placeholder="Ej. 2500.00"
                />

                {/* Clasificación de la entrada */}
                <label htmlFor="tipo_entrada">Tipo de entrada</label>
                <select
                    id="tipo_entrada"
                    name="tipo_entrada"
                    value={entrada.tipo_entrada}
                    onChange={cambiarDato}
                    required
                >
                    <option value="Compra">Compra</option>
                    <option value="Devolución">Devolución</option>
                    <option value="Ajuste">Ajuste</option>
                </select>

                {/* Estado de la operación */}
                <label htmlFor="estado">Estado</label>
                <select
                    id="estado"
                    name="estado"
                    value={entrada.estado}
                    onChange={cambiarDato}
                    required
                >
                    <option value="Recibida">Recibida</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Anulada">Anulada</option>
                </select>

                {/* Persona que recibió físicamente los productos */}
                <label htmlFor="recibido_por">Recibido por</label>
                <input
                    id="recibido_por"
                    type="text"
                    name="recibido_por"
                    maxLength="100"
                    value={entrada.recibido_por}
                    onChange={cambiarDato}
                    placeholder="Nombre de quien recibe"
                />

                {/* Usuario responsable del registro */}
                <label htmlFor="usuario">Usuario responsable</label>
                <input
                    id="usuario"
                    type="text"
                    name="usuario"
                    maxLength="100"
                    value={entrada.usuario}
                    onChange={cambiarDato}
                    placeholder="Nombre del usuario"
                />

                {/* Información adicional sobre la entrada */}
                <label htmlFor="observacion">Observaciones</label>
                <textarea
                    id="observacion"
                    name="observacion"
                    maxLength="255"
                    rows="4"
                    value={entrada.observacion}
                    onChange={cambiarDato}
                    placeholder="Escribe observaciones si son necesarias"
                />

                {/* Acciones del formulario */}
                <button type="submit" disabled={guardando}>
                    {guardando ? "Guardando..." : "Actualizar entrada"}
                </button>

                <button
                    type="button"
                    onClick={() => navigate("/entradas")}
                    disabled={guardando}
                >
                    Cancelar
                </button>
            </form>
        </div>
    );
}

export default EditarEntrada;
