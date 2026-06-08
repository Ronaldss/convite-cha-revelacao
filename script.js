const fallbackConfig = {
  event: {
    date: "04 Julho 2026",
    time: "às 14h",
    weekday: "",
    dateLabel: "",
    location:
      "Rua Fortaleza, Qd. J, N.1 - Loteamento São Caetano, Cidade Universitária",
    googleMapsUrl: "https://maps.app.goo.gl/V1ixm2jLEv1PtJDy9",
  },
  app: {
    storageMode: "local",
  },
  guests: {
    mode: "open",
    inviteParamName: "invite",
    names: [],
  },
  supabase: {
    url: "",
    anonKey: "",
    guestsTable: "guests",
    votesTable: "gender_votes",
  },
};

const config = window.CONVITE_CONFIG || fallbackConfig;

config.event = {
  ...config.event,
  date: config.event?.date || "04/07",
  time: config.event?.time || "14:00H",
  weekday: config.event?.weekday || "S\u00E1bado",
  dateLabel: config.event?.dateLabel || "DIA",
  location:
    config.event?.location || "R. Fortaleza, 63 - Cidade Universitária, Maceió - AL, 57072-313",
  coordinates: config.event?.coordinates || {
    latitude: "-9.6498487",
    longitude: "-35.7089492",
  },
  googleMapsUrl:
    config.event?.googleMapsUrl || "https://maps.app.goo.gl/V1ixm2jLEv1PtJDy9",
};

const storageKeys = {
  guest: "convite-cha-guest",
  votes: "convite-cha-votes",
};

let eventNodes = collectEventNodes();

const ui = {
  storageModeNote: document.getElementById("storage-mode-note"),
  guestListNote: document.getElementById("guest-list-note"),
  guestInviteNote: document.getElementById("guest-invite-note"),
  voteModeNote: document.getElementById("vote-mode-note"),
  voteSyncNote: document.getElementById("vote-sync-note"),
  voteStatusMessage: document.getElementById("vote-status-message"),
  copyLocationButton: document.getElementById("copy-location-button"),
  copyLocationFeedback: document.getElementById("copy-location-feedback"),
  rsvpForm: document.getElementById("rsvp-form"),
  guestNameInput: document.getElementById("guest-name"),
  guestNameError: document.getElementById("guest-name-error"),
  confirmationPanel: document.getElementById("confirmation-panel"),
  confirmedName: document.getElementById("confirmed-name"),
  voteLock: document.getElementById("vote-lock"),
  votePanel: document.getElementById("vote-panel-content"),
  voteOptions: document.getElementById("vote-options"),
  voteConfirm: document.getElementById("vote-confirm"),
  voteConfirmCopy: document.getElementById("vote-confirm-copy"),
  voteConfirmCancel: document.getElementById("vote-confirm-cancel"),
  voteConfirmSubmit: document.getElementById("vote-confirm-submit"),
  voteStage: document.getElementById("vote-stage"),
  voteSelected: document.getElementById("vote-selected"),
  girlCount: document.getElementById("girl-count"),
  boyCount: document.getElementById("boy-count"),
  voteNameSparks: document.getElementById("vote-name-sparks"),
  girlMeterFill: document.getElementById("girl-meter-fill"),
  boyMeterFill: document.getElementById("boy-meter-fill"),
  voteTags: document.getElementById("vote-tags"),
  coverCountdown: document.getElementById("cover-countdown"),
  coverCountdownValue: document.getElementById("cover-countdown-value"),
};

const dataStore = createDataStore();
const inviteCode = new URLSearchParams(window.location.search).get(
  config.guests?.inviteParamName || "invite",
);
const state = {
  guestContext: null,
  pendingVote: null,
};

bootstrap().catch((error) => {
  console.error("Falha ao iniciar o convite:", error);
});

async function bootstrap() {
  initEventDetails();
  initCoverCountdown();
  initPanels();
  initLocationSharing();
  initGiftRotation();
  initPosterMotion();
  initModeNotes();
  await initPresenceFlow();
  await initVoting();
  initVoteConfirmationInterception();
  initVoteSync();
}

function initCoverCountdown() {
  if (!ui.coverCountdown || !ui.coverCountdownValue) return;

  const currentDateText =
    config.event?.date || document.querySelector("[data-event-date]")?.textContent || "";
  const currentTimeText =
    config.event?.time || document.querySelector("[data-event-time]")?.textContent || "";
  const targetDate = parseEventCountdownDate(currentDateText, currentTimeText);
  if (!targetDate) return;

  const render = () => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) {
      ui.coverCountdownValue.textContent = "é hoje";
      return;
    }

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    ui.coverCountdownValue.textContent = formatCountdownValue(days, hours, minutes);
  };

  render();
  window.setInterval(render, 60000);
}

function parseEventCountdownDate(dateText, timeText) {
  const dateValue = String(dateText || "").trim();
  if (!dateValue) return null;

  const monthMap = {
    janeiro: 1,
    fevereiro: 2,
    março: 3,
    marco: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12,
  };

  let day = null;
  let month = null;
  let year = null;

  const longDateMatch = dateValue.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  if (longDateMatch) {
    day = Number(longDateMatch[1]);
    const monthName = normalizeString(longDateMatch[2]).toLowerCase();
    month = monthMap[monthName];
    year = Number(longDateMatch[3]);
  } else {
    const shortDateMatch = dateValue.match(/(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?/);
    if (!shortDateMatch) return null;
    day = Number(shortDateMatch[1]);
    month = Number(shortDateMatch[2]);
    const explicitYear = shortDateMatch[3] ? Number(shortDateMatch[3]) : null;
    const now = new Date();
    year = explicitYear
      ? explicitYear < 100
        ? 2000 + explicitYear
        : explicitYear
      : now.getFullYear();
  }

  if (!day || !month || !year) return null;

  const timeValue = String(timeText || "").trim();
  const timeMatch = timeValue.match(/(\d{1,2})[:h]?(\d{2})?/i);
  const hour = timeMatch ? Number(timeMatch[1]) : 0;
  const minute = timeMatch && timeMatch[2] ? Number(timeMatch[2]) : 0;

  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-03:00`);
}

function formatCountdownValue(days, hours, minutes) {
  if (days > 0) {
    if (days === 1) return "1 dia";
    return `${days} dias`;
  }

  if (hours > 0) {
    if (hours === 1) return "1 hora";
    return `${hours} horas`;
  }

  if (minutes <= 1) return "1 minuto";
  return `${minutes} minutos`;
}

function initLocationSharing() {
  if (!ui.copyLocationButton) return;

  ui.copyLocationButton.addEventListener("click", async () => {
    const locationText = buildShareableLocation();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(locationText);
      } else {
        copyTextFallback(locationText);
      }
      showCopyLocationFeedback("Localização copiada para compartilhar.");
    } catch {
      try {
        copyTextFallback(locationText);
        showCopyLocationFeedback("Localização copiada para compartilhar.");
      } catch {
        showCopyLocationFeedback("Não foi possível copiar agora.");
      }
    }
  });
}

function initEventDetails() {
  const { event } = config;
  const coverDate = formatCoverDate(event.date);
  const coverTime = formatCoverTime(event.time);
  renderCoverEventBlock(event);
  eventNodes = collectEventNodes();

  eventNodes.date.forEach((node) => {
    node.textContent = coverDate;
  });
  eventNodes.time.forEach((node) => {
    node.textContent = coverTime;
  });
  eventNodes.weekday.forEach((node) => {
    node.textContent = event.weekday;
  });
  eventNodes.dateLabel.forEach((node) => {
    node.textContent = event.dateLabel;
  });
  eventNodes.location.forEach((node) => {
    node.textContent = event.location;
  });
  const locationLines = splitLocation(event.location);
  eventNodes.locationLine1.forEach((node) => {
    node.textContent = locationLines.line1;
  });
  eventNodes.locationLine2.forEach((node) => {
    node.textContent = locationLines.line2;
  });
  eventNodes.latitude.forEach((node) => {
    node.textContent = event.coordinates?.latitude || "";
  });
  eventNodes.longitude.forEach((node) => {
    node.textContent = event.coordinates?.longitude || "";
  });
  eventNodes.mapLink.forEach((node) => {
    node.href = event.googleMapsUrl;
  });
}

function collectEventNodes() {
  return {
    date: [...document.querySelectorAll("[data-event-date]")],
    time: [...document.querySelectorAll("[data-event-time]")],
    weekday: [...document.querySelectorAll("[data-event-weekday]")],
    dateLabel: [...document.querySelectorAll("[data-event-date-label]")],
    location: [...document.querySelectorAll("[data-event-location]")],
    locationLine1: [...document.querySelectorAll("[data-event-location-line-1]")],
    locationLine2: [...document.querySelectorAll("[data-event-location-line-2]")],
    latitude: [...document.querySelectorAll("[data-event-latitude]")],
    longitude: [...document.querySelectorAll("[data-event-longitude]")],
    mapLink: [...document.querySelectorAll("[data-map-link]")],
  };
}

function renderCoverEventBlock(event) {
  const eventBlock = document.querySelector(".cover-event-block");
  if (!eventBlock) return;

  eventBlock.innerHTML = `
    <div class="cover-event cover-event-stacked" aria-label="Data e hora do evento">
      <strong class="cover-event-date-line" data-event-date>${escapeHtml(
        formatCoverDate(event.date),
      )}</strong>
      <span class="cover-event-time-line" data-event-time>${escapeHtml(
        formatCoverTime(event.time),
      )}</span>
    </div>
  `;
}

function buildShareableLocation() {
  const { location, coordinates } = config.event;
  const latitude = coordinates?.latitude || "";
  const longitude = coordinates?.longitude || "";

  return [
    location,
    latitude && longitude ? `Coordenadas: ${latitude}, ${longitude}` : "",
    config.event.googleMapsUrl || "",
  ]
    .filter(Boolean)
    .join("\n");
}

function copyTextFallback(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function normalizeString(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function showCopyLocationFeedback(message) {
  if (!ui.copyLocationFeedback) return;

  ui.copyLocationFeedback.textContent = message;
  ui.copyLocationFeedback.hidden = false;
  window.clearTimeout(showCopyLocationFeedback.timeoutId);
  showCopyLocationFeedback.timeoutId = window.setTimeout(() => {
    ui.copyLocationFeedback.hidden = true;
  }, 2200);
}

function initPanels() {
  const panels = [...document.querySelectorAll(".panel-shell")];

  document.querySelectorAll("[data-open-panel]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const targetId = trigger.dataset.openPanel;
      const panel = document.getElementById(targetId);
      if (!panel) return;

      closeAllPanels();
      pulseHotspot(trigger);
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
  });

  document.querySelectorAll("[data-close-panel]").forEach((button) => {
    button.addEventListener("click", closeAllPanels);
  });

  panels.forEach((panel) => {
    panel.addEventListener("click", (event) => {
      if (event.target === panel) {
        closeAllPanels();
      }
    });
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllPanels();
  });
}

function closeAllPanels() {
  document.querySelectorAll(".panel-shell").forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  document.body.style.overflow = "";
}

function pulseHotspot(trigger) {
  trigger.classList.add("is-active");
  window.setTimeout(() => {
    trigger.classList.remove("is-active");
  }, 520);
}

function initGiftRotation() {
  document.querySelectorAll(".gift-visual").forEach((visual) => {
    const images = [...visual.querySelectorAll(".gift-image")];
    if (images.length < 2) return;

    let activeIndex = 0;
    window.setInterval(() => {
      images[activeIndex].classList.remove("is-visible");
      activeIndex = (activeIndex + 1) % images.length;
      images[activeIndex].classList.add("is-visible");
    }, 3200);
  });
}

function initPosterMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll(".cover-action").forEach((button) => {
    button.addEventListener("pointerdown", () => {
      button.classList.add("is-active");
    });

    ["pointerup", "pointerleave", "blur"].forEach((eventName) => {
      button.addEventListener(eventName, () => {
        button.classList.remove("is-active");
      });
    });
  });
}

function initModeNotes() {
  const isRemote = dataStore.mode === "supabase";
  const isAllowlist = isGuestAllowlistEnabled();
  const isInviteLinks = isInviteLinksEnabled();
  if (ui.storageModeNote) {
    ui.storageModeNote.textContent = isRemote
      ? "Modo atual: confirmações salvas no Supabase."
      : "Modo atual: salvando apenas neste navegador.";
  }
  if (ui.guestListNote) {
    ui.guestListNote.textContent = isAllowlist
      ? "Lista de convidados ativa."
      : "Validacao por lista desativada.";
  }
  if (ui.guestInviteNote) {
    ui.guestInviteNote.textContent = isInviteLinks
      ? inviteCode
        ? "Convite individual validado."
        : "Este modo exige abrir o convite pelo link individual."
      : "Modo de link individual desativado.";
    ui.guestInviteNote.classList.toggle("is-highlight", isInviteLinks);
  }
  if (ui.voteModeNote) {
    ui.voteModeNote.textContent = isRemote
      ? "Os palpites desta versão serão compartilhados entre convidados via Supabase."
      : "Os palpites desta versão ficam salvos apenas neste navegador.";
  }
  if (ui.voteSyncNote) {
    ui.voteSyncNote.textContent = isRemote
      ? "Sincronização automática ativa entre convidados."
      : "Sem sincronização online nesta versão local.";
    ui.voteSyncNote.classList.toggle("is-online", isRemote);
  }
}

async function initPresenceFlow() {
  if (isInviteLinksEnabled()) {
    await initInvitePresenceFlow();
    return;
  }

  const savedGuest = await dataStore.getGuest();
  if (savedGuest) {
    ui.guestNameInput.value = savedGuest;
    unlockVoting(savedGuest);
  }

  ui.guestNameInput.addEventListener("input", () => {
    clearGuestValidationError();
  });

  ui.rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const guestName = ui.guestNameInput.value.trim();
    if (!guestName) return;

    if (!isGuestAllowed(guestName)) {
      showGuestValidationError();
      return;
    }

    await dataStore.saveGuest(guestName);
    unlockVoting(guestName);
  });
}

async function initInvitePresenceFlow() {
  ui.guestNameInput.readOnly = true;

  if (!inviteCode) {
    ui.guestNameInput.value = "";
    ui.guestNameInput.placeholder = "Abra o convite pelo link individual";
    showGuestValidationError(
      "Este convite precisa ser aberto pelo link individual enviado ao convidado.",
    );
    ui.rsvpForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  const guestContext = await dataStore.getGuestByInviteCode(inviteCode);
  if (!guestContext) {
    ui.guestNameInput.value = "";
    ui.guestNameInput.placeholder = "Convite não encontrado";
    showGuestValidationError("Este link de convite não foi encontrado.");
    ui.rsvpForm.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  state.guestContext = guestContext;
  ui.guestNameInput.value = guestContext.displayName || guestContext.name;
  clearGuestValidationError();

  if (guestContext.existingVote) {
    lockVotingWithExistingVote(guestContext);
  }

  if (guestContext.attendanceConfirmed) {
    unlockVoting(guestContext.displayName || guestContext.name);
  }

  ui.rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const savedGuest = await dataStore.confirmInviteGuest(guestContext);
    state.guestContext = savedGuest;
    unlockVoting(savedGuest.displayName || savedGuest.name);
  });
}

async function initVoting() {
  renderVotes(await dataStore.getVotes());

  document.querySelectorAll("[data-vote]").forEach((button) => {
    button.addEventListener("click", async () => {
      const guestName = await getActiveGuestName();
      if (!guestName) return;

      if (state.guestContext?.existingVote) {
        lockVotingWithExistingVote(state.guestContext);
        return;
      }

      const vote = button.dataset.vote;
      const saveResult = await dataStore.saveVote({
        name: guestName,
        vote,
        guestContext: state.guestContext,
      });

      if (saveResult?.blockedByExistingVote) {
        state.guestContext = {
          ...(state.guestContext || {}),
          existingVote: saveResult.existingVote,
          displayName: saveResult.existingVote.name,
        };
        lockVotingWithExistingVote(state.guestContext);
        return;
      }

      const votes = Array.isArray(saveResult) ? saveResult : saveResult.votes;

      ui.voteStage.dataset.theme = vote === "menina" ? "girl" : "boy";
      triggerVoteCelebration(vote, guestName);
      ui.voteSelected.textContent =
        vote === "menina"
          ? `${guestName} escolheu menina e fez o rosa acender nesta experiência.`
          : `${guestName} escolheu menino e fez o azul ganhar brilho nesta experiência.`;
      hideVoteStatusMessage();

      if (state.guestContext) {
        state.guestContext.existingVote = {
          name: guestName,
          vote,
          createdAt: new Date().toISOString(),
        };
      }

      renderVotes(votes);
    });
  });
}

function initVoteSync() {
  if (dataStore.mode !== "supabase") return;

  window.setInterval(async () => {
    const votes = await dataStore.getVotes();
    renderVotes(votes);
  }, 5000);
}

function initVoteConfirmationInterception() {
  ui.voteConfirmCancel?.addEventListener("click", closeVoteConfirmation);
  ui.voteConfirmSubmit?.addEventListener("click", confirmPendingVote);

  document.querySelectorAll("[data-vote]").forEach((button) => {
    if (button.dataset.confirmInterceptAttached === "true") return;

    button.addEventListener(
      "click",
      async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const guestName = await getActiveGuestName();
        if (!guestName) return;

        if (state.guestContext?.existingVote) {
          lockVotingWithExistingVote(state.guestContext);
          return;
        }

        openVoteConfirmation(button.dataset.vote, guestName);
      },
      true,
    );

    button.dataset.confirmInterceptAttached = "true";
  });
}

function openVoteConfirmation(vote, guestName) {
  state.pendingVote = { vote, guestName };
  if (ui.voteConfirmCopy) {
    ui.voteConfirmCopy.textContent =
      vote === "menina"
        ? "Confirmar Helena como seu palpite?"
        : "Confirmar Heitor como seu palpite?";
  }
  if (ui.voteConfirm) {
    ui.voteConfirm.hidden = false;
  }
  ui.voteOptions?.classList.add("is-awaiting-confirmation");
}

function closeVoteConfirmation() {
  state.pendingVote = null;
  if (ui.voteConfirm) {
    ui.voteConfirm.hidden = true;
  }
  ui.voteOptions?.classList.remove("is-awaiting-confirmation");
}

async function confirmPendingVote() {
  if (!state.pendingVote) return;

  const { vote, guestName } = state.pendingVote;
  if (ui.voteConfirmSubmit) {
    ui.voteConfirmSubmit.disabled = true;
  }

  try {
    const saveResult = await dataStore.saveVote({
      name: guestName,
      vote,
      guestContext: state.guestContext,
    });

    if (saveResult?.blockedByExistingVote) {
      state.guestContext = {
        ...(state.guestContext || {}),
        existingVote: saveResult.existingVote,
        displayName: saveResult.existingVote.name,
      };
      closeVoteConfirmation();
      lockVotingWithExistingVote(state.guestContext);
      return;
    }

    const votes = Array.isArray(saveResult) ? saveResult : saveResult.votes;

    ui.voteStage.dataset.theme = vote === "menina" ? "girl" : "boy";
    triggerVoteCelebration(vote, guestName);
    ui.voteSelected.textContent =
      vote === "menina"
        ? `${guestName} escolheu menina e fez o rosa acender nesta experiência.`
        : `${guestName} escolheu menino e fez o azul ganhar brilho nesta experiência.`;
    hideVoteStatusMessage();

    if (state.guestContext) {
      state.guestContext.existingVote = {
        name: guestName,
        vote,
        createdAt: new Date().toISOString(),
      };
    }

    closeVoteConfirmation();
    renderVotes(votes);
  } finally {
    if (ui.voteConfirmSubmit) {
      ui.voteConfirmSubmit.disabled = false;
    }
  }
}

function unlockVoting(guestName) {
  ui.confirmationPanel.hidden = false;
  ui.confirmedName.textContent = guestName;
  ui.voteLock.hidden = true;
  ui.votePanel.classList.remove("is-locked");
  ui.voteOptions.classList.remove("is-disabled");
  ui.votePanel.setAttribute("aria-disabled", "false");
  hideVoteStatusMessage();
}

function renderVotes(votes) {
  const normalizedVotes = getLatestVotesByGuest(votes);
  const girls = normalizedVotes.filter((entry) => entry.vote === "menina").length;
  const boys = normalizedVotes.filter((entry) => entry.vote === "menino").length;
  const total = girls + boys;
  const girlPercentage = total ? (girls / total) * 100 : 0;
  const boyPercentage = total ? (boys / total) * 100 : 0;

  ui.girlCount.textContent = String(girls);
  ui.boyCount.textContent = String(boys);
  ui.girlMeterFill.style.width = `${girlPercentage}%`;
  ui.boyMeterFill.style.width = `${boyPercentage}%`;
  ui.voteTags.innerHTML = "";

  if (!normalizedVotes.length) {
    ui.voteStage.dataset.theme = "";
    ui.voteSelected.textContent = "Escolha um lado para fazer o placar ganhar cor, brilho e movimento.";
    const emptyTag = document.createElement("span");
    emptyTag.className = "vote-tag";
    emptyTag.textContent = "Nenhum palpite registrado ainda";
    ui.voteTags.appendChild(emptyTag);
    return;
  }

  normalizedVotes
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .forEach((entry, index) => {
      const tag = document.createElement("span");
      tag.className = "vote-tag";
      tag.style.setProperty("--vote-tag-delay", `${Math.min(index, 7) * 0.06}s`);

      const dot = document.createElement("span");
      dot.className = `vote-dot ${
        entry.vote === "menina" ? "vote-dot-girl" : "vote-dot-boy"
      }`;

      const textGroup = document.createElement("span");
      textGroup.className = "vote-tag-copy";

      const nameText = document.createElement("strong");
      nameText.className = "vote-tag-name";
      nameText.textContent = entry.name;

      const choiceText = document.createElement("span");
      choiceText.className = "vote-tag-choice";
      choiceText.textContent = entry.vote === "menina" ? "palpitou Helena" : "palpitou Heitor";

      textGroup.append(nameText, choiceText);
      tag.append(dot, textGroup);
      ui.voteTags.appendChild(tag);
    });
}

function triggerVoteCelebration(vote, guestName) {
  if (!ui.voteStage) return;

  const theme = vote === "menina" ? "girl" : "boy";
  const displayName = formatSparkName(guestName);

  ui.voteStage.dataset.burst = theme;
  ui.voteStage.classList.remove("is-bursting");
  void ui.voteStage.offsetWidth;
  ui.voteStage.classList.add("is-bursting");

  window.clearTimeout(triggerVoteCelebration.timeoutId);
  triggerVoteCelebration.timeoutId = window.setTimeout(() => {
    ui.voteStage.classList.remove("is-bursting");
    delete ui.voteStage.dataset.burst;
  }, 1900);

  spawnNameSparks(theme, displayName);
}

function spawnNameSparks(theme, displayName) {
  if (!ui.voteNameSparks || !displayName) return;

  const sparkCount = 6;
  const leftAnchors = [12, 24, 38, 56, 72, 84];

  for (let index = 0; index < sparkCount; index += 1) {
    const spark = document.createElement("span");
    spark.className = `vote-name-spark vote-name-spark-${theme}`;
    spark.textContent = displayName;
    spark.style.left = `${leftAnchors[index] || 50}%`;
    spark.style.setProperty("--spark-delay", `${index * 0.08}s`);
    spark.style.setProperty(
      "--spark-drift",
      `${(index % 2 === 0 ? -1 : 1) * (10 + index * 2)}px`,
    );
    ui.voteNameSparks.appendChild(spark);

    window.setTimeout(() => {
      spark.remove();
    }, 2400);
  }
}

function formatSparkName(name) {
  const firstName = String(name || "").trim().split(/\s+/)[0] || "";
  return firstName.length > 10 ? firstName.slice(0, 10) : firstName;
}

function lockVotingWithExistingVote(guestContext) {
  const voterName = guestContext.displayName || guestContext.name || "Este convite";
  const existingVote = guestContext.existingVote;
  ui.confirmationPanel.hidden = false;
  ui.confirmedName.textContent = voterName;
  ui.voteLock.hidden = false;
  ui.votePanel.classList.add("is-locked");
  ui.voteOptions.classList.add("is-disabled");
  ui.votePanel.setAttribute("aria-disabled", "true");
  ui.voteLock.querySelector(".vote-lock-title").textContent = "Voto já registrado";
  ui.voteLock.querySelector(
    ".vote-lock-copy",
  ).textContent = "Este convite já foi usado para votar.";
  showVoteStatusMessage(
    `${voterName} já votou em ${
      existingVote?.vote || "uma opção"
    }. Este convite aceita apenas um voto.`,
  );
}

function showVoteStatusMessage(message) {
  ui.voteStatusMessage.textContent = message;
  ui.voteStatusMessage.hidden = false;
}

function hideVoteStatusMessage() {
  ui.voteStatusMessage.hidden = true;
}

function getLatestVotesByGuest(votes) {
  const latestByGuest = new Map();

  votes.forEach((entry) => {
    const current = latestByGuest.get(entry.name);
    if (!current || new Date(entry.createdAt) > new Date(current.createdAt)) {
      latestByGuest.set(entry.name, entry);
    }
  });

  return [...latestByGuest.values()];
}

function createDataStore() {
  if (isSupabaseConfigured()) {
    return createSupabaseStore();
  }

  return createLocalStore();
}

function isGuestAllowlistEnabled() {
  return config.guests?.mode === "allowlist" && Array.isArray(config.guests?.names);
}

function isInviteLinksEnabled() {
  return config.guests?.mode === "invite_links";
}

function isGuestAllowed(name) {
  if (!isGuestAllowlistEnabled()) return true;
  const normalizedIncoming = normalizeGuestName(name);
  return config.guests.names.some(
    (guestName) => normalizeGuestName(guestName) === normalizedIncoming,
  );
}

function normalizeGuestName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function showGuestValidationError(message = "Este nome não foi encontrado na lista de convidados.") {
  ui.guestNameInput.classList.add("is-invalid");
  ui.guestNameError.textContent = message;
  ui.guestNameError.hidden = false;
}

function clearGuestValidationError() {
  ui.guestNameInput.classList.remove("is-invalid");
  ui.guestNameError.hidden = true;
}

function createLocalStore() {
  return {
    mode: "local",
    async getGuest() {
      return localStorage.getItem(storageKeys.guest) || "";
    },
    async saveGuest(name) {
      localStorage.setItem(storageKeys.guest, name);
      return name;
    },
    async getVotes() {
      return readLocalVotes();
    },
    async saveVote(entry) {
      const votes = readLocalVotes();
      const existingIndex = votes.findIndex((item) => item.name === entry.name);
      const nextEntry = {
        ...entry,
        createdAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        votes[existingIndex] = nextEntry;
      } else {
        votes.push(nextEntry);
      }

      localStorage.setItem(storageKeys.votes, JSON.stringify(votes));
      return votes;
    },
    async getGuestByInviteCode(code) {
      return null;
    },
    async confirmInviteGuest(guestContext) {
      return guestContext;
    },
  };
}

function createSupabaseStore() {
  const { url, anonKey, guestsTable, votesTable } = config.supabase;
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };

  return {
    mode: "supabase",
    async getGuest() {
      return localStorage.getItem(storageKeys.guest) || "";
    },
    async saveGuest(name) {
      localStorage.setItem(storageKeys.guest, name);
      await fetch(`${url}/rest/v1/${guestsTable}`, {
        method: "POST",
        headers,
        body: JSON.stringify([{ name, attendance_confirmed: true }]),
      });
      return name;
    },
    async getGuestByInviteCode(code) {
      const response = await fetch(`${url}/rest/v1/rpc/get_invite_guest`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_invite_code: code }),
      });
      const data = await response.json();
      const guest = Array.isArray(data) ? data[0] : null;
      if (!guest) return null;

      return {
        id: guest.id,
        name: guest.name,
        displayName: guest.display_name || guest.name,
        inviteCode: guest.invite_code,
        attendanceConfirmed: guest.attendance_confirmed,
        existingVote: guest.existing_vote
          ? {
              name: guest.existing_vote_name || guest.display_name || guest.name,
              vote: guest.existing_vote,
              createdAt: guest.existing_vote_created_at,
            }
          : null,
      };
    },
    async confirmInviteGuest(guestContext) {
      await fetch(`${url}/rest/v1/rpc/confirm_invite_attendance`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_invite_code: guestContext.inviteCode }),
      });

      localStorage.setItem(storageKeys.guest, guestContext.displayName || guestContext.name);
      return {
        ...guestContext,
        attendanceConfirmed: true,
      };
    },
    async getVotes() {
      const response = await fetch(`${url}/rest/v1/rpc/list_public_votes`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const data = await response.json();
      return Array.isArray(data)
        ? data.map((item) => ({
            guestId: item.guest_id || null,
            name: item.guest_display_name || item.guest_name,
            vote: item.vote,
            createdAt: item.created_at,
          }))
        : [];
    },
    async saveVote(entry) {
      const payload = [
        {
          guest_name: entry.name,
          guest_display_name: entry.name,
          vote: entry.vote,
          ...(entry.guestContext?.id ? { guest_id: entry.guestContext.id } : {}),
        },
      ];

      const response = await fetch(`${url}/rest/v1/${votesTable}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok && entry.guestContext?.inviteCode) {
        const refreshedGuest = await this.getGuestByInviteCode(entry.guestContext.inviteCode);
        if (refreshedGuest?.existingVote) {
          return {
            blockedByExistingVote: true,
            existingVote: refreshedGuest.existingVote,
          };
        }
      }

      return { votes: await this.getVotes() };
    },
  };
}

async function getActiveGuestName() {
  if (state.guestContext?.displayName) return state.guestContext.displayName;
  return dataStore.getGuest();
}

function readLocalVotes() {
  const raw = localStorage.getItem(storageKeys.votes);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isSupabaseConfigured() {
  return (
    config.app?.storageMode === "supabase" &&
    config.supabase?.url &&
    config.supabase?.anonKey
  );
}

function splitLocation(location) {
  const parts = location.split(" - ");
  if (parts.length >= 2) {
    return {
      line1: parts[0],
      line2: parts.slice(1).join(" - "),
    };
  }

  const commaParts = location.split(", ");
  if (commaParts.length >= 2) {
    return {
      line1: commaParts.slice(0, 2).join(", "),
      line2: commaParts.slice(2).join(", ") || commaParts.slice(0, 2).join(", "),
    };
  }

  return {
    line1: location,
    line2: "",
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCoverDate(dateText) {
  const value = String(dateText || "").trim();
  if (/^\d{2}\/\d{2}$/.test(value)) {
    const [day, month] = value.split("/");
    const monthName = getMonthName(month);
    return `${day} ${monthName} 2026`;
  }

  if (/^\d{2}\/\s*[A-Za-zÀ-ÿ]+\s*\/\s*\d{4}$/u.test(value)) {
    return value.replaceAll("/", "").replace(/\s+/g, " ").trim();
  }

  return value;
}

function formatCoverTime(timeText) {
  const value = String(timeText || "").trim();
  if (/^\d{1,2}:00H$/i.test(value)) {
    return `às ${value.split(":")[0]}h`;
  }
  if (/^\d{1,2}H$/i.test(value)) {
    return `às ${value.replace(/H$/i, "h")}`;
  }
  if (/^\d{1,2}:\d{2}H$/i.test(value)) {
    return `às ${value.replace(/H$/i, "h")}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    return `às ${value}`;
  }
  if (/^\d{1,2}h$/i.test(value)) {
    return `às ${value.toLowerCase()}`;
  }
  return value;
}

function getMonthName(monthNumber) {
  const months = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };

  return months[monthNumber] || monthNumber;
}



