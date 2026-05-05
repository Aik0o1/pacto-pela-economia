import readXlsxFile from 'read-excel-file';

const arquivoUrl = "https://docs.google.com/spreadsheets/d/1yCVzDbUnD0MD_12gXnRCs2Pgj7YAafSDvrI3q_L9CoA/edit?usp=drive_link"; // URL pública do arquivo

fetch(arquivoUrl)
  .then((response) => {
    if (!response.ok) throw new Error("Erro ao carregar o arquivo Excel.");
    return response.blob();
  })
  .then((blob) => readXlsxFile(blob))
  .then((linhas) => {
    console.log(linhas);
  })
  .catch((err) => {
    console.error("Erro ao processar o arquivo Excel:", err);
  });
