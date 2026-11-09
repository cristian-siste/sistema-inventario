import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
    obtenerProductos,
    obtenerProveedores,
    crearCompra
} from "../services/api";
import "./NuevaCompra.css";

// Obtiene la fecha local para evitar diferencias de zona horaria.
function obtenerFechaLocal() {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return anio + "-" + mes + "-" + dia;
}

// Permite trabajar tanto con listas directas como con respuestas JSON
// que contienen la lista dentro de la propiedad "datos".
function extraerLista(respuesta) {
    if (Array.isArray(respuesta)) {
        return respuesta;
    }

    if (respuesta && Array.isArray(respuesta.datos)) {
        return respuesta.datos;
    }

    return [];
}

function NuevaCompra() {
    const navigate = useNavigate();

    // Información que se carga desde la API PHP.
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);

    // Datos generales de la orden de compra.
    const [compra, setCompra] = useState({
        proveedor_id: "",
        fecha_pedido: obtenerFechaLocal(),
        fecha_estimada_entrega: "",
        observaciones: ""
    });

    // La orden comienza con una fila vacía para agregar un producto.
    const [detalles, setDetalles] = useState([
        {
            producto_id: "",
            cantidad: 1,
            precio_unitario: 0
        }
    ]);

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    // Consulta los proveedores y productos disponibles en el backend.
    useEffect(() => {
        async function cargarDatos() {
            try {
                setCargando(true);
                setError("");

                const resultados = await Promise.all([
                    obtenerProveedores(),
                    obtenerProductos()
                ]);

                setProveedores(extraerLista(resultados[0]));
                setProductos(extraerLista(resultados[1]));
            } catch (err) {
                setError(
                    "No fue posible cargar los proveedores y productos. " +
                    (err.message || "Verifica que Apache esté funcionando.")
                );
            } finally {
                setCargando(false);
            }
        }

        cargarDatos();
    }, []);

    // Actualiza los campos generales de la compra.
    function cambiarCompra(evento) {
        const { name, value } = evento.target;

        setCompra((anterior) => ({
            ...anterior,
            [name]: value
        }));
    }

    // Cambia el producto, la cantidad o el precio de una fila.
    function cambiarDetalle(indice, campo, valor) {
        setDetalles((anteriores) =>
            anteriores.map((detalle, posicion) => {
                if (posicion !== indice) {
                    return detalle;
                }

                const actualizado = {
                    ...detalle,
                    [campo]: valor
                };

                // Al seleccionar un producto, se propone su precio de compra.
                if (campo === "producto_id") {
                    const producto = productos.find(
                        (item) => String(item.id) === String(valor)
                    );

                    actualizado.precio_unitario = producto
                        ? Number(producto.precioCompra || 0)
                        : 0;
                }

                return actualizado;
            })
        );
    }

    // Agrega una nueva fila de producto.
    function agregarDetalle() {
        setDetalles((anteriores) => [
            ...anteriores,
            {
                producto_id: "",
                cantidad: 1,
                precio_unitario: 0
            }
        ]);
    }

    // Elimina una fila sin afectar las demás.
    function eliminarDetalle(indice) {
        setDetalles((anteriores) =>
            anteriores.filter((_, posicion) => posicion !== indice)
        );
    }

    // Calcula el subtotal de cada fila y el valor total de la orden.
    const total = detalles.reduce((suma, detalle) => {
        return suma +
            Number(detalle.cantidad || 0) *
            Number(detalle.precio_unitario || 0);
    }, 0);

    // Formatea los valores monetarios en pesos colombianos.
    function formatoMoneda(valor) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }).format(valor);
    }

    // Comprueba los datos y registra la orden mediante la API PHP.
    async function guardarCompra(evento) {
        evento.preventDefault();
        setError("");
        setMensaje("");

        if (!compra.proveedor_id) {
            setError("Selecciona un proveedor.");
            return;
        }

        if (!compra.fecha_pedido) {
            setError("Selecciona la fecha del pedido.");
            return;
        }

        if (detalles.length === 0) {
            setError("Agrega al menos un producto.");
            return;
        }

        for (let i = 0; i < detalles.length; i++) {
            const detalle = detalles[i];

            if (!detalle.producto_id) {
                setError("Selecciona un producto en la fila " + (i + 1) + ".");
                return;
            }

            if (
                !Number.isInteger(Number(detalle.cantidad)) ||
                Number(detalle.cantidad) < 1
            ) {
                setError("La cantidad de cada producto debe ser un entero mayor que cero.");
                return;
            }

            if (
                detalle.precio_unitario === "" ||
                !Number.isFinite(Number(detalle.precio_unitario)) ||
                Number(detalle.precio_unitario) < 0
            ) {
                setError("Cada precio debe ser un número igual o mayor que cero.");
                return;
            }
        }

        // Se envían únicamente los campos que espera crear.php.
        const datosCompra = {
            proveedor_id: Number(compra.proveedor_id),
            fecha_pedido: compra.fecha_pedido,
            fecha_estimada_entrega: compra.fecha_estimada_entrega || null,
            observaciones: compra.observaciones.trim(),
            detalles: detalles.map((detalle) => ({
                producto_id: Number(detalle.producto_id),
                cantidad: Number(detalle.cantidad),
                precio_unitario: Number(detalle.precio_unitario)
            }))
        };

        try {
            setGuardando(true);

            const respuesta = await crearCompra(datosCompra);

            // Si la API informa un error, se conserva la página para corregirlo.
            if (respuesta && respuesta.success === false) {
                throw new Error(respuesta.mensaje || respuesta.error || "No se pudo registrar la compra.");
            }

            setMensaje("Compra registrada correctamente. Regresando al listado...");

            // Espera brevemente para que el usuario vea la confirmación.
            setTimeout(() => {
                navigate("/compras");
            }, 900);
        } catch (err) {
            setError(
                err.message ||
                "No se pudo registrar la compra. Verifica la conexión con la API."
            );
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="layout">
            <Sidebar />

            <main className="nueva-compra-contenedor">
                <header className="nueva-compra-encabezado">
                    <div>
                        <p className="nueva-compra-miga">Inventario / Compras</p>
                        <h1>Nueva orden de compra</h1>
                        <p>Registra un pedido a un proveedor y sus productos.</p>
                    </div>

                    <Link to="/compras" className="nueva-compra-boton-secundario">
                        Volver a compras
                    </Link>
                </header>

                {error && (
                    <div className="nueva-compra-alerta error" role="alert">
                        {error}
                    </div>
                )}

                {mensaje && (
                    <div className="nueva-compra-alerta exito" role="status">
                        {mensaje}
                    </div>
                )}

                {cargando ? (
                    <div className="nueva-compra-cargando">
                        Cargando proveedores y productos...
                    </div>
                ) : (
                    <form onSubmit={guardarCompra}>
                        <section className="nueva-compra-panel">
                            <h2>Información del pedido</h2>

                            <div className="nueva-compra-grid">
                                <div className="nueva-compra-campo">
                                    <label htmlFor="proveedor_id">Proveedor *</label>

                                    <select
                                        id="proveedor_id"
                                        name="proveedor_id"
                                        value={compra.proveedor_id}
                                        onChange={cambiarCompra}
                                        required
                                    >
                                        <option value="">Selecciona un proveedor</option>

                                        {proveedores.map((proveedor) => (
                                            <option key={proveedor.id} value={proveedor.id}>
                                                {proveedor.nombre ||
                                                    proveedor.razon_social ||
                                                    ("Proveedor " + proveedor.id)}
                                            </option>
                                        ))}
                                    </select>

                                    {proveedores.length === 0 && (
                                        <small>No hay proveedores disponibles en la API.</small>
                                    )}
                                </div>

                                <div className="nueva-compra-campo">
                                    <label htmlFor="fecha_pedido">Fecha del pedido *</label>

                                    <input
                                        id="fecha_pedido"
                                        type="date"
                                        name="fecha_pedido"
                                        value={compra.fecha_pedido}
                                        onChange={cambiarCompra}
                                        required
                                    />
                                </div>

                                <div className="nueva-compra-campo">
                                    <label htmlFor="fecha_estimada_entrega">
                                        Entrega estimada
                                    </label>

                                    <input
                                        id="fecha_estimada_entrega"
                                        type="date"
                                        name="fecha_estimada_entrega"
                                        value={compra.fecha_estimada_entrega}
                                        min={compra.fecha_pedido}
                                        onChange={cambiarCompra}
                                    />
                                </div>

                                <div className="nueva-compra-campo nueva-compra-campo-completo">
                                    <label htmlFor="observaciones">Observaciones</label>

                                    <textarea
                                        id="observaciones"
                                        name="observaciones"
                                        value={compra.observaciones}
                                        onChange={cambiarCompra}
                                        rows="3"
                                        placeholder="Escribe notas adicionales del pedido..."
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="nueva-compra-panel">
                            <div className="nueva-compra-titulo-detalles">
                                <div>
                                    <h2>Productos del pedido</h2>
                                    <p>Selecciona los productos y las cantidades solicitadas.</p>
                                </div>

                                <button
                                    type="button"
                                    className="nueva-compra-boton-secundario"
                                    onClick={agregarDetalle}
                                    disabled={guardando}
                                >
                                    + Agregar producto
                                </button>
                            </div>

                            {productos.length === 0 && (
                                <p className="nueva-compra-aviso">
                                    No hay productos disponibles. Verifica el endpoint de productos.
                                </p>
                            )}

                            <div className="nueva-compra-tabla-contenedor">
                                <table className="nueva-compra-tabla">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio unitario</th>
                                            <th>Subtotal</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {detalles.map((detalle, indice) => (
                                            <tr key={indice}>
                                                <td>
                                                    <select
                                                        value={detalle.producto_id}
                                                        onChange={(evento) =>
                                                            cambiarDetalle(
                                                                indice,
                                                                "producto_id",
                                                                evento.target.value
                                                            )
                                                        }
                                                        required
                                                        aria-label={"Producto de la fila " + (indice + 1)}
                                                    >
                                                        <option value="">Selecciona</option>

                                                        {productos.map((producto) => (
                                                            <option
                                                                key={producto.id}
                                                                value={producto.id}
                                                            >
                                                                {producto.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="1"
                                                        value={detalle.cantidad}
                                                        onChange={(evento) =>
                                                            cambiarDetalle(
                                                                indice,
                                                                "cantidad",
                                                                evento.target.value
                                                            )
                                                        }
                                                        required
                                                        aria-label={"Cantidad de la fila " + (indice + 1)}
                                                    />
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={detalle.precio_unitario}
                                                        onChange={(evento) =>
                                                            cambiarDetalle(
                                                                indice,
                                                                "precio_unitario",
                                                                evento.target.value
                                                            )
                                                        }
                                                        required
                                                        aria-label={"Precio de la fila " + (indice + 1)}
                                                    />
                                                </td>

                                                <td className="nueva-compra-subtotal">
                                                    {formatoMoneda(
                                                        Number(detalle.cantidad || 0) *
                                                        Number(detalle.precio_unitario || 0)
                                                    )}
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="nueva-compra-boton-eliminar"
                                                        onClick={() => eliminarDetalle(indice)}
                                                        disabled={
                                                            guardando || detalles.length === 1
                                                        }
                                                        title="Eliminar producto"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="nueva-compra-total">
                                <span>Total de la orden</span>
                                <strong>{formatoMoneda(total)}</strong>
                            </div>

                            <p className="nueva-compra-nota">
                                El inventario no aumenta al crear la orden. El stock se actualizará
                                cuando registres la recepción de la mercancía.
                            </p>
                        </section>

                        <div className="nueva-compra-acciones">
                            <Link to="/compras" className="nueva-compra-boton-cancelar">
                                Cancelar
                            </Link>

                            <button
                                type="submit"
                                className="nueva-compra-boton-guardar"
                                disabled={guardando || cargando}
                            >
                                {guardando ? "Guardando..." : "Registrar compra"}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}

export default NuevaCompra;