import { useEffect, useRef, useState } from "react";
import maskImageUrl from "../components/mascara-foto.png";

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    image.src = source;
  });
}

function safeFileName(value) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return normalized || "participante";
}

export default function CongressPhotoPage() {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const streamRef = useRef(null);
  const [name, setName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!cameraOpen || !streamRef.current || !videoRef.current) return undefined;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.play().catch(() => setError("Não foi possível iniciar a câmera neste dispositivo."));
    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [cameraOpen]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function openCamera() {
    setError("");
    setStatus("");
    if (cameraOpen) {
      stopCamera();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("A câmera não está disponível. Abra esta página em HTTPS ou localhost.");
      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "user" } },
      });
      setPhotoDataUrl("");
      setCameraOpen(true);
    } catch (cameraError) {
      setError(
        cameraError.name === "NotAllowedError"
          ? "Permita o acesso à câmera nas configurações do navegador."
          : "Não foi possível acessar a câmera deste dispositivo.",
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setError("A câmera ainda está iniciando. Tente novamente em instantes.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.92));
    setZoom(1);
    setError("");
    setStatus("Selfie capturada. Confira o enquadramento antes de baixar.");
    stopCamera();
  }

  function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("A imagem deve ter até 12 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(String(reader.result));
      setZoom(1);
      setError("");
      setStatus("Imagem carregada. Confira o enquadramento antes de baixar.");
    };
    reader.onerror = () => setError("Não foi possível ler essa imagem.");
    reader.readAsDataURL(file);
    stopCamera();
  }

  async function downloadPoster() {
    if (!name.trim() || !photoDataUrl) return;
    setError("");
    setStatus("");

    try {
      const [mask, photo] = await Promise.all([
        loadImage(maskImageUrl),
        loadImage(photoDataUrl),
      ]);
      const canvas = document.createElement("canvas");
      canvas.width = mask.naturalWidth;
      canvas.height = mask.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(mask, 0, 0, canvas.width, canvas.height);

      const diameter = Math.min(canvas.width * 0.596, canvas.height * 0.3375);
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.506;
      const radius = diameter / 2;
      const scale = Math.max(diameter / photo.naturalWidth, diameter / photo.naturalHeight) * zoom;
      const drawnWidth = photo.naturalWidth * scale;
      const drawnHeight = photo.naturalHeight * scale;

      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        photo,
        centerX - drawnWidth / 2,
        centerY - drawnHeight / 2,
        drawnWidth,
        drawnHeight,
      );
      context.restore();

      canvas.toBlob((blob) => {
        if (!blob) {
          setError("Não foi possível gerar o pôster.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `congresso-pediatria-${safeFileName(name)}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus("Pôster baixado com sucesso.");
      }, "image/png");
    } catch {
      setError("Não foi possível montar o pôster. Tente selecionar outra imagem.");
    }
  }

  function clearPhoto() {
    stopCamera();
    setPhotoDataUrl("");
    setZoom(1);
    setError("");
    setStatus("");
  }

  function goToName() {
    nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="photo-page">
      <header className="photo-page__header">
        <div className="photo-page__header-inner">
          <p className="photo-page__eyebrow">42º Congresso Brasileiro de Pediatria</p>
          <h1>Leve sua lembrança</h1>
          <p>Coloque seu rosto na arte do simpósio e baixe o pôster personalizado.</p>
        </div>
      </header>

      <div className="photo-page__content">
        <section className="photo-controls" aria-labelledby="photo-form-title">
          <h2 id="photo-form-title">Monte seu pôster</h2>

          <div className="field">
            <label htmlFor="participant-name">Seu nome <span className="req">*</span></label>
            <input
              ref={nameInputRef}
              id="participant-name"
              type="text"
              autoComplete="name"
              maxLength={100}
              placeholder="Digite seu nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <button
            className="btn btn--primary photo-download"
            type="button"
            disabled={!name.trim() || !photoDataUrl}
            onClick={downloadPoster}
          >
            Baixar pôster PNG
          </button>
          <p className="photo-privacy">A imagem é montada neste dispositivo e não é enviada ao servidor.</p>
        </section>

        <section className="photo-preview" aria-label="Prévia do pôster">
          <div className="photo-poster">
            {photoDataUrl && (
              <img
                className="photo-poster__selfie"
                src={photoDataUrl}
                alt="Prévia da selfie no pôster"
                style={{ transform: `scale(${zoom})` }}
              />
            )}
            {cameraOpen && (
              <video
                className="photo-poster__selfie"
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Prévia da selfie na arte"
                style={{ transform: `scaleX(-1) scale(${zoom})` }}
              />
            )}
            <img className="photo-poster__mask" src={maskImageUrl} alt="Arte do simpósio do Congresso Brasileiro de Pediatria" />
          </div>
          {name.trim() && <p className="photo-preview__name">{name.trim()}</p>}

          <div className="photo-preview__tools">
            <div className="photo-actions">
              {photoDataUrl ? (
                <>
                  <button className="btn btn--primary" type="button" onClick={goToName}>
                    Continuar para nome
                  </button>
                  <button className="btn btn--ghost" type="button" onClick={clearPhoto}>
                    Trocar foto
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={cameraOpen ? capturePhoto : openCamera}
                  >
                    {cameraOpen ? "Capturar selfie" : "Tirar selfie"}
                  </button>
                  <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Escolher imagem
                  </button>
                </>
              )}
              {cameraOpen && (
                <button className="photo-camera-close" type="button" onClick={stopCamera}>
                  Fechar câmera
                </button>
              )}
              <input
                ref={fileInputRef}
                id="participant-photo"
                className="photo-file-input"
                type="file"
                accept="image/*"
                onChange={selectPhoto}
              />
            </div>

            {(photoDataUrl || cameraOpen) && (
              <div className="photo-zoom">
                <label htmlFor="photo-zoom">Ajustar enquadramento</label>
                <input
                  id="photo-zoom"
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </div>
            )}

            {error && <p className="photo-message photo-message--error" role="alert">{error}</p>}
            {status && <p className="photo-message" role="status">{status}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
