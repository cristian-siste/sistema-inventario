import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { obtenerCompras, recibirCompra, despacharCompra } from "../services/api";
import "./Compras.css";

/* ============================================================
   MÓDULO DE COMPRAS
   Consulta órdenes, muestra fechas/cantidades y permite registrar
   despachos y recepciones parciales desde la API.
   ============================================================ */

// Convierte la respuesta de la API en una lista de compras.
function extraerCompras(respuesta) {
    if (Array.isArray(respuesta)) return respuesta;
    if (Array.isArray(respuesta?.datos)) return respuesta.datos;
    if (Array.isArray(respuesta?.compras)) return respuesta.compras;
    if (Array.isArray(respuesta?.data)) return respuesta.data;
    return [];
}

// Presenta valores como pesos colombianos.
function formatoMoneda(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency", currency: "COP", maximumFractionDigits: 0,
    }).format(Number(valor) || 0);
}

// Presenta fechas sin mostrar valores inválidos.
function formatoFecha(valor) {
    if (!valor) return "Sin fecha";
    const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) return "Sin fecha";
    return fecha.toLocaleDateString("es-CO", {
        year: "numeric", month: "2-digit", day: "2-digit",
    });
}

// Normaliza estados para comparar sin diferencias de tildes o mayúsculas.
function normalizarEstado(estado) {
    return String(estado || "Pendiente").trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Devuelve los detalles de una orden si la API los incluye.
function obtenerDetalles(compra) {
    return Array.isArray(compra?.detalles) ? compra.detalles : [];
}

// Calcula unidades solicitadas, despachadas y recibidas.
function resumirCantidades(detalles) {
    return detalles.reduce((totales, detalle) => {
        totales.solicitada += Math.max(0, Number(detalle.cantidad) || 0);
        totales.despachada += Math.max(0, Number(detalle.cantidad_despachada) || 0);
        totales.recibida += Math.max(0, Number(detalle.cantidad_recibida) || 0);
        return totales;
    }, { solicitada: 0, despachada: 0, recibida: 0 });
}

// Calcula unidades que aún se pueden despachar.
function unidadesPorDespachar(detalle) {
    return Math.max(0, (Number(detalle.cantidad) || 0) -
        (Number(detalle.cantidad_despachada) || 0));
}

// Calcula unidades despachadas que aún no han sido recibidas.
function unidadesPendientes(detalle) {
    return Math.max(0, (Number(detalle.cantidad_despachada) || 0) -
        (Number(detalle.cantidad_recibida) || 0));
}

// Devuelve la clase visual correspondiente al estado de compra.
function claseEstado(estado) {
    const valor = normalizarEstado(estado);
    if (valor === "pendiente") return "estado-pendiente";
    if (valor === "despachada") return "estado-despachada";
    if (valor === "en transito") return "estado-transito";
    if (valor === "parcialmente recibida") return "estado-parcial";
    if (valor === "recibida") return "estado-recibida";
    if (valor === "cancelada") return "estado-cancelada";
    return "estado-pendiente";
}

export default function Compras() {
    // Datos, estados de pantalla y mensajes.
    const [compras, setCompras] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("Todas");

    // Información y controles del modal de movimiento.
    const [modalAbierto, setModalAbierto] = useState(false);
    const [tipoMovimiento, setTipoMovimiento] = useState("despacho");
    const [compraSeleccionada, setCompraSeleccionada] = useState(null);
    const [cantidades, setCantidades] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState("");

    // Consulta las órdenes en el backend.
    const cargarCompras = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            const respuesta = await obtenerCompras();
            if (respuesta?.success === false) {
                throw new Error(respuesta.mensaje || "No fue posible consultar las compras.");
            }
            setCompras(extraerCompras(respuesta));
        } catch (err) {
            setError(err?.message || "Error al cargar las órdenes de compra.");
        } finally {
            setCargando(false);
        }
    }, []);

    // Ejecuta la consulta cuando se abre la pantalla.
    useEffect(() => { cargarCompras(); }, [cargarCompras]);

    // Calcula los indicadores generales.
    const resumen = useMemo(() => {
        const datos = { pendientes: 0, proceso: 0, recibidas: 0, valor: 0 };
        compras.forEach((compra) => {
            const estado = normalizarEstado(compra.estado);
            if (estado === "pendiente") datos.pendientes++;
            if (["despachada", "en transito", "parcialmente recibida"].includes(estado)) datos.proceso++;
            if (estado === "recibida") datos.recibidas++;
            if (estado !== "cancelada") datos.valor += Number(compra.total) || 0;
        });
        return datos;
    }, [compras]);

    // Filtra órdenes por el estado seleccionado.
    const comprasFiltradas = useMemo(() => {
        if (filtroEstado === "Todas") return compras;
        return compras.filter((compra) =>
            normalizarEstado(compra.estado) === normalizarEstado(filtroEstado));
    }, [compras, filtroEstado]);

    // Abre el modal y coloca como cantidad inicial el máximo disponible.
    const abrirModal = (compra, tipo) => {
        const iniciales = {};
        obtenerDetalles(compra).forEach((detalle) => {
            const idDetalle = detalle.id ?? detalle.detalle_id;
            const disponible = tipo === "despacho"
                ? unidadesPorDespachar(detalle) : unidadesPendientes(detalle);
            iniciales[idDetalle] = String(disponible);
        });
        setCompraSeleccionada(compra);
        setTipoMovimiento(tipo);
        setCantidades(iniciales);
        setErrorModal("");
        setMensaje("");
        setModalAbierto(true);
    };

    // Cierra el modal si no hay una operación en curso.
    const cerrarModal = () => {
        if (guardando) return;
        setModalAbierto(false);
        setCompraSeleccionada(null);
        setCantidades({});
        setErrorModal("");
    };

    // Controla las cantidades digitadas en el modal.
    const cambiarCantidad = (idDetalle, valor) => {
        if (valor !== "" && !/^\d+$/.test(valor)) return;
        setCantidades((actuales) => ({ ...actuales, [idDetalle]: valor }));
    };

    // Valida y guarda el despacho o la recepción desde la API.
    const guardarMovimiento = async (evento) => {
        evento.preventDefault();
        if (!compraSeleccionada) return;
        const detalles = obtenerDetalles(compraSeleccionada);
        const seleccionados = [];

        for (const detalle of detalles) {
            const idDetalle = detalle.id ?? detalle.detalle_id;
            const cantidad = Number(cantidades[idDetalle]) || 0;
            const disponible = tipoMovimiento === "despacho"
                ? unidadesPorDespachar(detalle) : unidadesPendientes(detalle);
            if (!Number.isInteger(cantidad) || cantidad < 0) {
                setErrorModal("Ingrese cantidades enteras iguales o mayores que cero.");
                return;
            }
            if (cantidad > disponible) {
                setErrorModal(`La cantidad de ${detalle.producto || "este producto"} supera lo disponible (${disponible}).`);
                return;
            }
            if (cantidad > 0) seleccionados.push({ detalle_id: Number(idDetalle), cantidad });
        }

        if (seleccionados.length === 0) {
            setErrorModal("Registre al menos una cantidad mayor que cero.");
            return;
        }

        setGuardando(true);
        setErrorModal("");
        try {
            const payload = {
                compra_id: Number(compraSeleccionada.id ?? compraSeleccionada.compra_id),
                detalles: seleccionados,
            };
            const respuesta = tipoMovimiento === "despacho"
                ? await despacharCompra(payload)
                : await recibirCompra(payload);
            if (respuesta?.success === false) {
                throw new Error(respuesta.mensaje || "No fue posible guardar el movimiento.");
            }
            setModalAbierto(false);
            setCompraSeleccionada(null);
            setCantidades({});
            setMensaje(tipoMovimiento === "despacho"
                ? "Despacho registrado. El stock debe cambiar cuando se reciban los productos."
                : "Recepción registrada. Revise que el inventario se haya actualizado.");
            await cargarCompras();
        } catch (err) {
            setErrorModal(err?.message || "Ocurrió un error al guardar el movimiento.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="contenedor">
            <Sidebar />
            <main className="compras-contenedor">
                {/* Encabezado y accesos del módulo. */}
                <header className="compras-encabezado">
                    <div>
                        <h1>Gestión de compras</h1>
                        <p>Órdenes, entregas estimadas, despachos y recepciones.</p>
                    </div>
                    <div className="compras-encabezado-acciones">
                        <button type="button" className="compras-btn compras-btn-secundario"
                            onClick={cargarCompras} disabled={cargando}>
                            {cargando ? "Actualizando..." : "Actualizar"}
                        </button>
                        <Link to="/nueva-compra" className="compras-btn compras-btn-principal">
                            + Nueva compra
                        </Link>
                    </div>
                </header>

                {/* Avisos de resultado o error. */}
                {mensaje && <div className="compras-mensaje compras-mensaje-exito" role="status">
                    {mensaje}<button type="button" onClick={() => setMensaje("")} aria-label="Cerrar">×</button>
                </div>}
                {error && <div className="compras-mensaje compras-mensaje-error" role="alert">
                    {error}<button type="button" onClick={() => setError("")} aria-label="Cerrar">×</button>
                </div>}

                {/* Tarjetas de indicadores. */}
                <section className="compras-resumen">
                    <article className="compras-tarjeta"><span className="compras-tarjeta-etiqueta">Órdenes pendientes</span><strong>{resumen.pendientes}</strong></article>
                    <article className="compras-tarjeta"><span className="compras-tarjeta-etiqueta">En proceso / tránsito</span><strong>{resumen.proceso}</strong></article>
                    <article className="compras-tarjeta"><span className="compras-tarjeta-etiqueta">Órdenes recibidas</span><strong>{resumen.recibidas}</strong></article>
                    <article className="compras-tarjeta"><span className="compras-tarjeta-etiqueta">Valor no cancelado</span><strong>{formatoMoneda(resumen.valor)}</strong></article>
                </section>

                {/* Selector de estado y cantidad de resultados. */}
                <section className="compras-filtros">
                    <label htmlFor="compras-filtro-estado">Filtrar por estado:</label>
                    <select id="compras-filtro-estado" value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}>
                        <option>Todas</option><option>Pendiente</option><option>Despachada</option>
                        <option>En tránsito</option><option>Parcialmente recibida</option>
                        <option>Recibida</option><option>Cancelada</option>
                    </select>
                    <span className="compras-conteo">{comprasFiltradas.length} orden(es)</span>
                </section>

                {/* Tabla con información de fechas y cantidades. */}
                <section className="compras-tabla-contenedor">
                    {cargando ? <div className="compras-estado-vacio">Cargando órdenes de compra...</div>
                        : comprasFiltradas.length === 0 ? <div className="compras-estado-vacio">No hay órdenes para mostrar.</div>
                            : <table className="compras-tabla">
                                <thead><tr>
                                    <th>N.º orden</th><th>Proveedor</th><th>Fecha del pedido</th>
                                    <th>Entrega estimada</th><th>Productos</th><th>Unidades</th>
                                    <th>Recibidas</th><th>Total</th><th>Estado</th><th>Acciones</th>
                                </tr></thead>
                                <tbody>
                                    {comprasFiltradas.map((compra, indice) => {
                                        const idCompra = compra.id ?? compra.compra_id ?? indice;
                                        const detalles = obtenerDetalles(compra);
                                        const totales = resumirCantidades(detalles);
                                        const nombresProductos = detalles.map((d) =>
                                            d.producto || d.nombre_producto || "Producto sin nombre").join(", ");
                                        const estado = compra.estado || "Pendiente";
                                        const cancelada = normalizarEstado(estado) === "cancelada";
                                        const puedeDespachar = detalles.some((d) => unidadesPorDespachar(d) > 0);
                                        const puedeRecibir = detalles.some((d) => unidadesPendientes(d) > 0);
                                        const cantidadProductos = detalles.length || compra.cantidad_productos || compra.total_productos || "—";
                                        return <tr key={idCompra}>
                                            <td><strong>#{compra.id ?? compra.compra_id ?? "—"}</strong></td>
                                            <td><strong>{compra.proveedor || compra.proveedor_nombre || compra.nombre_proveedor || "Proveedor sin nombre"}</strong>
                                                <small className="compras-productos-detalle">{compra.proveedor_id ? `Código: ${compra.proveedor_id}` : ""}</small></td>
                                            <td>{formatoFecha(compra.fecha_pedido)}</td>
                                            <td><strong>{formatoFecha(compra.fecha_estimada_entrega)}</strong>
                                                {compra.fecha_estimada_entrega && <small className="compras-productos-detalle">Fecha prevista</small>}</td>
                                            <td><span title={nombresProductos || "Sin detalle"}>{cantidadProductos}</span>
                                                <small className="compras-productos-detalle">{nombresProductos || "Sin detalle"}</small></td>
                                            <td><strong>{totales.solicitada}</strong><small className="compras-productos-detalle">Despachadas: {totales.despachada}</small></td>
                                            <td><strong>{totales.recibida}</strong><small className="compras-productos-detalle">Pendientes: {Math.max(0, totales.despachada - totales.recibida)}</small></td>
                                            <td><strong>{formatoMoneda(compra.total)}</strong></td>
                                            <td><span className={`compras-estado ${claseEstado(estado)}`}>{estado}</span></td>
                                            <td><div className="compras-acciones">
                                                {!cancelada && puedeDespachar && <button type="button" className="compras-btn-accion compras-btn-despachar" onClick={() => abrirModal(compra, "despacho")}>Registrar despacho</button>}
                                                {!cancelada && puedeRecibir && <button type="button" className="compras-btn-accion compras-btn-recibir" onClick={() => abrirModal(compra, "recepcion")}>Recibir productos</button>}
                                                {cancelada && <span className="compras-sin-acciones">Orden cancelada</span>}
                                                {!cancelada && !puedeDespachar && !puedeRecibir && <span className="compras-sin-acciones">Proceso completado</span>}
                                            </div></td>
                                        </tr>;
                                    })}
                                </tbody>
                            </table>}
                </section>

                {/* Modal común para registrar despacho o recepción. */}
                {modalAbierto && compraSeleccionada && <div className="compras-modal-fondo" role="presentation"
                    onMouseDown={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}>
                    <section className="compras-modal" role="dialog" aria-modal="true" aria-labelledby="compras-modal-titulo">
                        <div className="compras-modal-encabezado"><div>
                            <h2 id="compras-modal-titulo">{tipoMovimiento === "despacho" ? "Registrar despacho" : "Registrar recepción"}</h2>
                            <p>Orden #{compraSeleccionada.id ?? compraSeleccionada.compra_id} · {compraSeleccionada.proveedor || compraSeleccionada.proveedor_nombre || compraSeleccionada.nombre_proveedor || "Proveedor"}</p>
                        </div><button type="button" className="compras-modal-cerrar" onClick={cerrarModal} disabled={guardando} aria-label="Cerrar">×</button></div>
                        <form onSubmit={guardarMovimiento}>
                            <p className="compras-modal-ayuda">{tipoMovimiento === "despacho"
                                ? "Indique las unidades que el proveedor despacha en este movimiento."
                                : "Registre solo las unidades que llegaron físicamente y fueron verificadas."}</p>
                            {errorModal && <div className="compras-mensaje compras-mensaje-error" role="alert">{errorModal}</div>}
                            <div className="compras-modal-tabla-contenedor"><table className="compras-modal-tabla">
                                <thead><tr><th>Producto</th><th>Solicitadas</th><th>{tipoMovimiento === "despacho" ? "Por despachar" : "Por recibir"}</th><th>Cantidad movimiento</th></tr></thead>
                                <tbody>{obtenerDetalles(compraSeleccionada).map((detalle) => {
                                    const idDetalle = detalle.id ?? detalle.detalle_id;
                                    const disponible = tipoMovimiento === "despacho" ? unidadesPorDespachar(detalle) : unidadesPendientes(detalle);
                                    return <tr key={idDetalle}><td>{detalle.producto || detalle.nombre_producto || `Producto ${detalle.producto_id ?? ""}`}</td>
                                        <td>{Number(detalle.cantidad) || 0}</td><td><strong>{disponible}</strong></td><td>
                                            <input type="number" min="0" max={disponible} step="1"
                                                value={cantidades[idDetalle] ?? "0"}
                                                onChange={(e) => cambiarCantidad(idDetalle, e.target.value)}
                                                disabled={disponible <= 0 || guardando}
                                                aria-label={`Cantidad de ${detalle.producto || detalle.producto_id}`} />
                                        </td></tr>;
                                })}</tbody>
                            </table></div>
                            <div className="compras-modal-pie">
                                <button type="button" className="compras-btn compras-btn-secundario" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                                <button type="submit" className="compras-btn compras-btn-principal" disabled={guardando}>
                                    {guardando ? "Guardando..." : tipoMovimiento === "despacho" ? "Guardar despacho" : "Confirmar recepción"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>}
            </main>
        </div>
    );
}
