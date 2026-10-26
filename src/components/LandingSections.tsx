/* eslint-disable @next/next/no-img-element */
import type { Site } from "@/lib/site";
import LandingPortal from "./LandingPortal";
export default function LandingSections({ site, logo, heroVideo, configured }: { site: Site; logo: string; heroVideo: string; configured: boolean }) {
return <>
<section className="layer hero" id="inicio">
<div className="bg" data-speed="14"><video autoPlay muted loop playsInline preload="auto" poster="/media/video/hero.webp"><source src={heroVideo} type="video/mp4" /></video></div>
<div className="shade"></div>
<div className="wrap">
<p className="eyebrow">{"STARFIT GYM · Nuevo Chimbote"}</p>
<h1 className="d" id="title">{site.heroTitle}{" "}<span className="lime">{site.heroAccent}</span></h1>
<div className="hero-foot">
<p >{site.heroSubtitle}</p>
<div className="ctas"><a className="btn btn-lime" href="#sedes">{"Ver sedes"}</a><a className="btn btn-ghost" href="#clases">{"Ver clases"}</a></div>
</div>
</div>
</section>
<div className="marquee" aria-hidden="true"><div className="row"><span >{"Baile"}</span><span >{"Funcional"}</span><span >{"Xbox"}</span><span >{"Zumba"}</span><span >{"Step"}</span><span >{"Functional Kids"}</span><span >{"Baile"}</span><span >{"Funcional"}</span><span >{"Xbox"}</span><span >{"Zumba"}</span><span >{"Step"}</span><span >{"Functional Kids"}</span></div></div>
<section className="layer manifesto">
<div className="bg" data-speed="10"><img src="/media/img/dark-lift.webp" alt="" loading="lazy" /></div>
<div className="shade" style={{"background": "color-mix(in srgb, var(--ink) 80%, transparent)"}}></div>
<div className="wrap">
<p className="eyebrow">{"Familia Starfit"}</p>
<p className="big" id="manifesto">{"Aquí no solo venimos a entrenar. Venimos a vivir experiencias, a apoyarnos y a crecer juntos, con fuerza, disciplina y corazón peruano."}</p>
</div>
</section>
<section className="sedes-s" id="sedes">
<div className="wrap">
<div className="head"><h2 className="d">{"Elige tu "}<span className="lime">{"sede"}</span></h2><p >{"Dos gimnasios en Nuevo Chimbote, mismo horario y la misma familia. Pasa el mouse o toca una sede."}</p></div>
<div className="panels">
<article className="panel open" tabIndex={0}>
<img src="/media/img/press.webp" alt="" loading="lazy" />
<div className="p-head"><span className="p-tag">{"01"}</span><h3 className="d">{"Pardo"}</h3></div>
<div className="p-body">
<dl >
<div ><dt >{"Dirección"}</dt><dd >{"Cruce de Ppao, Nuevo Chimbote"}</dd></div>
<div ><dt >{"WhatsApp"}</dt><dd className="phone"><strong >{"993 538 789"}</strong><button className="copy" type="button">{"Copiar"}</button></dd></div>
<div ><dt >{"Horario"}</dt><dd >{"6:00 a. m. – 10:30 p. m."}</dd></div>
</dl>
<div className="ctas">
<a className="btn btn-lime" href="https://wa.me/51993538789?text=Hola%20STARFIT%20Sede%20Pardo%2C%20quiero%20informaci%C3%B3n" target="_blank" rel="noopener">{"Escribir a Pardo"}</a>
<a className="btn btn-ghost" href="https://www.google.com/maps/search/STARFIT+GYM+Pardo+Nuevo+Chimbote" target="_blank" rel="noopener">{"Cómo llegar"}</a>
</div>
</div>
</article>
<article className="panel" tabIndex={0}>
<img src="/media/img/bench-coach.webp" alt="" loading="lazy" />
<div className="p-head"><span className="p-tag">{"02"}</span><h3 className="d">{"Agraria"}</h3></div>
<div className="p-body">
<dl >
<div ><dt >{"Dirección"}</dt><dd >{"Av. Naciones Unidas con Av. Agraria, Nuevo Chimbote"}</dd></div>
<div ><dt >{"WhatsApp"}</dt><dd className="phone"><strong >{"920 373 854"}</strong><button className="copy" type="button">{"Copiar"}</button></dd></div>
<div ><dt >{"Horario"}</dt><dd >{"6:00 a. m. – 10:30 p. m."}</dd></div>
</dl>
<div className="ctas">
<a className="btn btn-lime" href="https://wa.me/51920373854?text=Hola%20STARFIT%20Sede%20Agraria%2C%20quiero%20informaci%C3%B3n" target="_blank" rel="noopener">{"Escribir a Agraria"}</a>
<a className="btn btn-ghost" href="https://www.google.com/maps/search/Av.+Naciones+Unidas+y+Agraria+Nuevo+Chimbote" target="_blank" rel="noopener">{"Cómo llegar"}</a>
</div>
</div>
</article>
</div>
</div>
</section>
<section className="layer hours" id="horario">
<div className="frame"><video autoPlay muted loop playsInline preload="none" poster="/media/video/strength.webp"><source src="/media/video/strength.mp4" type="video/mp4" /></video></div>
<div className="wrap txt">
<p className="eyebrow" style={{"color": "var(--bone)"}}>{"Horario extendido"}</p>
<p className="d time">{"6:00 a. m."}<br  /><span className="lime">{"10:30 p. m."}</span></p>
<p style={{"margin": "0", "maxWidth": "34rem"}}>{"Madruga, entrena después del trabajo o en tu momento ideal."}</p>
<div className="day" role="img" aria-label="Abierto de 6:00 a 22:30">
<div className="bar"><span className="open-range"></span></div>
<div className="ticks"><span >{"0 h"}</span><span >{"6 h"}</span><span >{"12 h"}</span><span >{"18 h"}</span><span >{"24 h"}</span></div>
</div>
<small >{"Confirma domingos y feriados por WhatsApp."}</small>
</div>
</section>
<section className="classes-s" id="clases">
<div className="wrap"><div className="head"><h2 className="d">{"Clases"}<br  /><span className="lime">{"grupales"}</span></h2><p >{"Baile, Funcional, Xbox, Zumba, Step y el taller Functional Kids."}</p></div></div>
<div className="track-wrap" id="classes">
<div className="track">
<article className="cls"><img src="/media/img/group-class.webp" alt="" loading="lazy" /><span className="n">{"01"}</span><div ><h3 className="d">{"Baile"}</h3><p >{"Para disfrutar cada paso."}</p></div></article>
<article className="cls"><img src="/media/img/ropes.webp" alt="" loading="lazy" /><span className="n">{"02"}</span><div ><h3 className="d">{"Funcional"}</h3><p >{"Resultados reales en menos tiempo."}</p></div></article>
<article className="cls"><img src="/media/img/squat.webp" alt="" loading="lazy" /><span className="n">{"03"}</span><div ><h3 className="d">{"Xbox"}</h3><p >{"Pura adrenalina."}</p></div></article>
<article className="cls"><img src="/media/img/floor-class.webp" alt="" loading="lazy" /><span className="n">{"04"}</span><div ><h3 className="d">{"Zumba"}</h3><p >{"Para llenarte de energía."}</p></div></article>
<article className="cls"><img src="/media/img/facility.webp" alt="" loading="lazy" /><span className="n">{"05"}</span><div ><h3 className="d">{"Step"}</h3><p >{"Para activar todo tu cuerpo."}</p></div></article>
<article className="cls kids"><img src="/media/img/core.webp" alt="" loading="lazy" /><span className="n">{"06"}</span><div ><h3 className="d">{"Functional Kids"}</h3><p >{"Coordinación, confianza y trabajo en equipo."}</p></div></article>
</div>
</div>
<div className="prog"><i ></i></div>
</section>
<LandingPortal configured={configured} />
<section className="community" id="comunidad">
<div className="wrap">
<div className="head"><h2 className="d">{"Comunidad"}<br  /><span className="lime">{"Starfit"}</span></h2><p >{"Toca cada evento para ver sus fotos en Instagram."}</p></div>
<div className="events">
<a className="ev zm" href="https://www.instagram.com/p/DbTqkQpFkRM/" target="_blank" rel="noopener"><img src="/media/img/curl.webp" alt="" loading="lazy" /><div ><span >{"Julio 2026 · Pardo y Agraria"}</span><h3 className="d">{"Fiestas Patrias"}</h3><p >{"Premios, sorpresas y orgullo peruano."}</p></div></a>
<a className="ev zm" href="https://www.instagram.com/p/DVm4RGeFgvz/" target="_blank" rel="noopener"><img src="/media/img/yoga.webp" alt="" loading="lazy" /><div ><span >{"Marzo 2026"}</span><h3 className="d">{"Día de la Mujer"}</h3><p >{"Una jornada para celebrar su fuerza."}</p></div></a>
<a className="ev zm" href="https://www.instagram.com/p/DVmeq1ngV1c/" target="_blank" rel="noopener"><img src="/media/img/pushup.webp" alt="" loading="lazy" /><div ><span >{"Marzo 2026"}</span><h3 className="d">{"Cierre de Verano"}</h3><p >{"Bailetón, yunsa y retos fit."}</p></div></a>
<a className="ev zm" href="https://www.instagram.com/p/DVmwTIwERKy/" target="_blank" rel="noopener"><img src="/media/img/rack.webp" alt="" loading="lazy" /><div ><span >{"Marzo 2026"}</span><h3 className="d">{"Clausura Functional Kids"}</h3><p >{"Nuestros pequeños campeones cerraron el taller."}</p></div></a>
</div>
<p className="note">{"Fotos referenciales. Las fotos reales de cada evento están en @sstarfitgym."}</p>
</div>
</section>
<section className="layer final">
<div className="bg" data-speed="12"><video autoPlay muted loop playsInline preload="none" poster="/media/video/intensity.webp"><source src="/media/video/intensity.mp4" type="video/mp4" /></video></div>
<div className="shade"></div>
<div className="wrap">
<img className="logo rv" src={logo} alt="Logo STARFIT" />
<h2 className="d rv">{"Empieza "}<span className="lime">{"hoy"}</span></h2>
<a className="btn btn-lime rv" href={site.signup} target="_blank" rel="noopener">{"Solicitar inscripción →"}</a>
</div>
</section>
</>;
}
