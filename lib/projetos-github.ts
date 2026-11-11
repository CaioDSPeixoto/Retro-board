export type ProjetoGithub = {
  id: string;
  nome: string;
  linguagem: string;
  corDaLinguagem: string;
  tecnologias: string[];
  urlRepositorio: string;
  urlDemo?: string;
};

export const USUARIO_GITHUB = "CaioDSPeixoto";

export const URL_PERFIL_GITHUB = `https://github.com/${USUARIO_GITHUB}`;

export const projetosGithub: ProjetoGithub[] = [
  {
    id: "cspixel",
    nome: "cspixel",
    linguagem: "Python",
    corDaLinguagem: "#3572A5",
    tecnologias: ["Python", "Windows", "RAW"],
    urlRepositorio: `${URL_PERFIL_GITHUB}/cspixel`,
  },
  {
    id: "encurtador-url",
    nome: "EncurtadorURL",
    linguagem: "C#",
    corDaLinguagem: "#178600",
    tecnologias: [".NET 9", "Razor Pages", "MongoDB", "Docker"],
    urlRepositorio: `${URL_PERFIL_GITHUB}/EncurtadorURL`,
  },
  {
    id: "projeto-mvc",
    nome: "ProjetoMVC",
    linguagem: "C#",
    corDaLinguagem: "#178600",
    tecnologias: [".NET 8", "ASP.NET MVC", "ASP.NET Identity"],
    urlRepositorio: `${URL_PERFIL_GITHUB}/ProjetoMVC`,
  },
  {
    id: "pokemon",
    nome: "Pokemon",
    linguagem: "JavaScript",
    corDaLinguagem: "#F1E05A",
    tecnologias: ["Next.js", "React"],
    urlRepositorio: `${URL_PERFIL_GITHUB}/Pokemon`,
    urlDemo: "https://pokemon-seven-eta.vercel.app",
  },
];
