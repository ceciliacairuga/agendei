// Testa as classes JS do frontend (as MESMAS usadas pelas telas) contra a API real, em Node 20+.
//   node tests/frontend-classes.test.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Users from "../views/assets/_common/classes/Users.js";
import Images from "../views/assets/_common/classes/Images.js";
import Appointments from "../views/assets/_common/classes/Appointments.js";
import Services from "../views/assets/_common/classes/Services.js";
import Dashboard from "../views/assets/_common/classes/Dashboard.js";
import Appointment from "../views/assets/_common/classes/Appointment.js";

let ok = 0, fail = 0;
const check = (name, cond, extra = "") => { cond ? (ok++, console.log("  PASS ", name)) : (fail++, console.log("  FAIL ", name, extra)); };
const PASS = "senha1234";

// PNG 1x1 e JPEG mínimo
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==", "base64");
const fileOf = (buf, name, type) => new File([buf], name, { type });

const anon = new Users();
const login = async (email, admin = false) => {
    const r = admin ? await anon.loginAdminFromForm?.(Object.assign(new FormData(), {})) : null;
    const res = await anon.postForm(admin ? "/users/login-admin" : "/users/login", { email, password: PASS });
    return res.data.token;
};
const tokClient = await login("maria@teste.com");
const tokAdmin = await login("admin@teste.com", true);

const users = new Users(); users.setAuthToken(tokClient);
const images = new Images(); images.setAuthToken(tokClient);
const imagesAdmin = new Images(); imagesAdmin.setAuthToken(tokAdmin);
const appts = new Appointments(); appts.setAuthToken(tokClient);
const apptsAdmin = new Appointments(); apptsAdmin.setAuthToken(tokAdmin);
const servicesAdmin = new Services(); servicesAdmin.setAuthToken(tokAdmin);
const dash = new Dashboard(); dash.setAuthToken(tokAdmin);

console.log("== Validação do navegador (Images.validateFile)");
check("aceita PNG pequeno", Images.validateFile(fileOf(png, "a.png", "image/png"), Images.MAX_USER_PHOTO_BYTES) === null);
check("rejeita PDF", Images.validateFile(fileOf(png, "a.pdf", "application/pdf"), 1e6) !== null);
check("rejeita arquivo grande", Images.validateFile(fileOf(Buffer.alloc(3 * 1024 * 1024, 1), "g.png", "image/png"), Images.MAX_USER_PHOTO_BYTES) !== null);
check("rejeita ausência de arquivo", Images.validateFile(null, 1) !== null);

console.log("== Perfil");
const me = await users.me();
check("me() retorna usuário com nome", me.status === "success" && !!me.data.name);
const up = await users.update({ name: "Maria Souza", email: "maria@teste.com" });   // PUT urlencoded (putForm)
check("update() via putForm funciona", up.status === "success", JSON.stringify(up));
const photo = await images.uploadUserPhoto(fileOf(png, "foto.png", "image/png"));
check("uploadUserPhoto devolve photo_url", /^https?:\/\/.+\/storage\/uploads\/users\/[a-f0-9]{32}\.png$/.test(photo.photo_url), JSON.stringify(photo));
const me2 = await users.me();
check("foto persiste após novo /users/me", me2.data.photo_url === photo.photo_url);
const img = await fetch(photo.photo_url);
check("URL da foto serve image/png", img.status === 200 && img.headers.get("content-type") === "image/png");
let err = null; try { await images.uploadUserPhoto(fileOf(Buffer.from("<?php echo 1;"), "x.png", "image/png")); } catch (e) { err = e; }
check("uploadUserPhoto rejeita arquivo falso com mensagem", !!err && /imagem|Formato/i.test(err.message), err?.message);

console.log("== Agendamentos (classes usadas pelo dashboard)");
const date = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
const av = await appts.availability(1, date);
check("availability() lista horários", Array.isArray(av.slots) && av.slots.length > 5);
const free = av.slots.find((s) => s.available);
const created = await appts.insert({ service_id: 1, appointment_date: date, appointment_time: free.time });
check("insert() cria agendamento", created.status === "created" && !!created.data.service_name);
const list = await appts.list();
const mine = list.find((a) => a.id === created.data.id);
check("list() devolve instâncias de Appointment com serviceName", mine instanceof Appointment && mine.serviceName === "Corte Feminino");
check("startsAt é uma Date válida", mine.startsAt instanceof Date && !Number.isNaN(mine.startsAt.getTime()));
let dup = null; try { await appts.insert({ service_id: 1, appointment_date: date, appointment_time: free.time }); } catch (e) { dup = e; }
const dupRes = await appts.postForm("/appointments/insert", { service_id: 1, appointment_date: date, appointment_time: free.time });
check("duplicado volta status de erro com mensagem", dupRes.status !== "created" && /já possui|indispon/i.test(dupRes.message), dupRes.message);
const adminList = await apptsAdmin.listFiltered({ date, status: "pending", client: "maria" });
check("listFiltered() (admin) aplica filtros", adminList.some((a) => a.id === created.data.id));
await apptsAdmin.update(created.data.id, { status: "confirmed" });
check("update() (admin) altera status", (await apptsAdmin.listFiltered({ date })).find((a) => a.id === created.data.id).status === "confirmed");
await appts.cancel(created.data.id);
check("cancel() (cliente) cancela", (await appts.list()).find((a) => a.id === created.data.id).status === "cancelled");
let cancelErr = null; try { await appts.cancel(created.data.id); } catch (e) { cancelErr = e; }
check("cancel() repetido lança erro legível", !!cancelErr && /cancelado/i.test(cancelErr.message), cancelErr?.message);
await apptsAdmin.remove(created.data.id);

// Uma linha inválida NÃO pode derrubar a lista (causa do dashboard travado)
check("Appointment.tryFromJSON ignora linha inválida", Appointment.tryFromJSON({ id: 1 }) === null);

console.log("== Galeria de serviços (classes usadas pela tela admin)");
const svc = await servicesAdmin.insert({ services_type_id: 1, name: "Teste Node", description: "d", duration: 30, price: 10 });
const sid = svc.data.id;
check("serviço criado", svc.status === "created" && sid > 0);
check("galeria vazia lista []", (await imagesAdmin.listServiceImages(sid)).length === 0);
const r1 = await imagesAdmin.uploadServiceImages(sid, [fileOf(png, "1.png", "image/png"), fileOf(png, "2.png", "image/png")]);
check("uploadServiceImages envia 2 arquivos", r1.saved.length === 2 && r1.failed.length === 0);
const r2 = await imagesAdmin.uploadServiceImages(sid, [fileOf(png, "3.png", "image/png")]);
check("adicionar mais uma mantém as anteriores", (await imagesAdmin.listServiceImages(sid)).length === 3 && r2.saved.length === 1);
const mixed = await imagesAdmin.uploadServiceImages(sid, [fileOf(png, "ok.png", "image/png"), fileOf(Buffer.from("MZ"), "mal.png", "image/png")]);
check("envio misto devolve saved + failed", mixed.saved.length === 1 && mixed.failed.length === 1 && mixed.failed[0].file === "mal.png");
const gallery = await imagesAdmin.listServiceImages(sid);
const first = await fetch(gallery[0].image_url);
check("imagem da galeria é servida (200, image/png)", first.status === 200 && first.headers.get("content-type") === "image/png");
await imagesAdmin.removeServiceImage(sid, gallery[0].id);
check("removeServiceImage remove só uma", (await imagesAdmin.listServiceImages(sid)).length === gallery.length - 1);
let notAdmin = null; try { await images.uploadServiceImages(sid, [fileOf(png, "x.png", "image/png")]); } catch (e) { notAdmin = e; }
check("cliente não envia imagem de serviço (erro de permissão)", !!notAdmin);
const listAll = await servicesAdmin.listAll();
check("services.listAll traz cover_url e image_count", listAll.data.find((s) => s.id === sid).image_count === 3 && !!listAll.data.find((s) => s.id === sid).cover_url);
const gone = gallery.slice(1).map((g) => g.image_url);
const del = await servicesAdmin.remove(sid);
check("excluir serviço retorna sucesso", del.status === "success");
const after = await Promise.all(gone.map((u) => fetch(u).then((r) => r.status)));
check("arquivos do serviço excluído não existem mais (404)", after.every((s) => s === 404), after.join(","));

console.log("== Dashboard admin");
const d = await dash.admin();
check("dashboard admin traz totais reais", ["total_users", "total_services", "total_appointments", "upcoming_appointments"].every((k) => Number.isInteger(Number(d.data.counts[k]))));
check("dashboard admin traz next_appointments", Array.isArray(d.data.next_appointments));

console.log(`\nRESULTADO: ${ok} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
