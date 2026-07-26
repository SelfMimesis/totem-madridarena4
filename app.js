(() => {
  "use strict";

  const DESIGN_WIDTH = 2160;
  const DESIGN_HEIGHT = 3840;
  const stage = document.querySelector("#stage");
  const terminal = document.querySelector("#terminal");
  const mainVideo = document.querySelector("#mainVideo");
  const videoTrigger = document.querySelector("#videoTrigger");
  const signalModal = document.querySelector("#signalModal");
  const modalClose = document.querySelector("#modalClose");
  const leftSlider = document.querySelector("#leftSlider");
  const sliderNodes = [...document.querySelectorAll(".svg-hotspot--left")];
  const actionButtons = [...document.querySelectorAll(".svg-hotspot--right")];
  const utilityButtons = [...document.querySelectorAll(".svg-hotspot--utility")];
  const indicatorButton = document.querySelector(".svg-hotspot--indicator");
  const buttonFxLayer = document.querySelector("#buttonFxLayer");
  const svgButtonsArt = document.querySelector(".svg-controls__art");
  const notificationZone = document.querySelector("#notificationZone");
  const notificationEyebrow = document.querySelector("#notificationEyebrow");
  const notificationTitle = document.querySelector("#notificationTitle");
  const notificationMessage = document.querySelector("#notificationMessage");
  const notificationCode = document.querySelector("#notificationCode");
  const fullscreenHotspot = document.querySelector("#fullscreenHotspot");
  const toast = document.querySelector("#toast");
  const toastText = document.querySelector("#toastText");
  const paymentFlow = document.querySelector("#paymentFlow");
  const paymentClose = document.querySelector("#paymentClose");
  const paymentScreens = [...document.querySelectorAll("[data-payment-screen]")];
  const paymentSteps = [...document.querySelectorAll("[data-payment-step]")];
  const paymentCards = [...document.querySelectorAll("[data-payment-card]")];
  const paymentDots = [...document.querySelectorAll(".payment-carousel-dots i")];
  const paymentCardStack = document.querySelector(".payment-card-stack");
  const paymentPrev = document.querySelector("#paymentPrev");
  const paymentNext = document.querySelector("#paymentNext");
  const paymentCardConfirm = document.querySelector("#paymentCardConfirm");
  const paymentPlanName = document.querySelector("#paymentPlanName");
  const paymentPlanCredit = document.querySelector("#paymentPlanCredit");
  const paymentTotal = document.querySelector("#paymentTotal");
  const paymentKeyButtons = [...document.querySelectorAll("[data-payment-key]")];
  const paymentPinDots = [...document.querySelectorAll("#paymentPinDots i")];
  const paymentPinDisplay = document.querySelector("#paymentPinDots");
  const paymentPinConfirm = document.querySelector("#paymentPinConfirm");
  const paymentFingerprint = document.querySelector("#paymentFingerprint");
  const paymentFingerprintStatus = document.querySelector("#paymentFingerprintStatus");
  const paymentMatchRate = document.querySelector("#paymentMatchRate");
  const paymentTransaction = document.querySelector("#paymentTransaction");
  const paymentReceiptTotal = document.querySelector("#paymentReceiptTotal");

  let activeNode = 0;
  let draggingSlider = false;
  let toastTimer = 0;
  let lastFullscreenTap = 0;
  let fullscreenRequest = null;
  let lastFocusedElement = null;
  let notificationTimer = 0;
  let artReactionTimer = 0;
  let activePaymentCard = 0;
  let paymentScreenName = "cards";
  let paymentPin = "";
  let paymentCloseTimer = 0;
  let fingerprintTimer = 0;
  let fingerprintCompleteTimer = 0;
  let fingerprintInterval = 0;
  let lastPaymentFocusedElement = null;
  let paymentCardSwipe = null;
  let suppressPaymentCardClick = false;
  const lastButtonAnimation = new WeakMap();

  const actionNotifications = {
    SYSTEM: ["SYSTEM // CORE", "CORE AWAKENED", "Secuencia lumínica del núcleo activada."],
    VECTOR: ["NAV // VECTOR", "VECTOR ACQUIRED", "Trayectoria principal fijada y sincronizada."],
    ZENITH: ["NAV // ZENITH", "ZENITH LOCKED", "Coordenadas superiores verificadas."],
    JUNCTION: ["NAV // JUNCTION", "JUNCTION OPEN", "Intersección de tránsito preparada."],
    RELAY: ["COMMS // RELAY", "RELAY ENGAGED", "Canal de retransmisión enlazado."],
    LIFELINE: ["SYSTEM // LIFELINE", "LIFELINE STABLE", "Reserva vital dentro de parámetros."],
    ARCHIVE: ["DATA // ARCHIVE", "ARCHIVE UNSEALED", "Registro histórico disponible para consulta."],
    TRANSROLL: ["TRANSIT // ROLL", "TRANSROLL READY", "Matriz de embarque preparada."],
  };

  const paymentPlans = [
    { name: "CURRENCY // SILVER", credit: "35.50", total: "35.50 CR" },
    { name: "CURRENCY // VIOLET", credit: "72.04", total: "72.04 CR" },
    { name: "CURRENCY // DEEP BLUE", credit: "108.60", total: "108.60 CR" },
  ];

  const paymentScreenOrder = ["cards", "pin", "fingerprint", "success"];

  function fitStage() {
    const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
    stage.style.setProperty("--stage-scale", scale.toFixed(6));
  }

  function showToast(message, duration = 1500) {
    window.clearTimeout(toastTimer);
    toastText.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, duration);
  }

  function pulseHaptic(duration = 12) {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  }

  function hideControlNotification() {
    window.clearTimeout(notificationTimer);
    notificationZone.classList.remove("is-visible");
    notificationZone.setAttribute("aria-hidden", "true");
  }

  function getControlName(button) {
    return button.dataset.action || button.dataset.utility || button.dataset.label || "SYSTEM";
  }

  function showControlNotification(button) {
    const controlName = getControlName(button);
    const content = button.dataset.label
      ? ["NODE // SELECT", `${button.dataset.label} LINKED`, "Canal táctil sincronizado con la red de navegación."]
      : actionNotifications[controlName] || ["SYSTEM // EVENT", "SIGNAL RECEIVED", "Comando aceptado por el terminal."];
    const sequence = String(Math.floor(performance.now() * 10)).padStart(6, "0").slice(-6);

    notificationEyebrow.textContent = content[0];
    notificationTitle.textContent = content[1];
    notificationMessage.textContent = content[2];
    notificationCode.textContent = `EZ // ${sequence} // ${controlName}`;

    window.clearTimeout(notificationTimer);
    notificationZone.classList.remove("is-visible");
    void notificationZone.offsetWidth;
    notificationZone.classList.add("is-visible");
    notificationZone.setAttribute("aria-hidden", "false");

    notificationTimer = window.setTimeout(hideControlNotification, 3200);
  }

  function emitButtonFx(button) {
    const buttonRect = button.getBoundingClientRect();
    const terminalRect = terminal.getBoundingClientRect();
    const terminalScale = terminalRect.width / terminal.offsetWidth;
    const centerX = (buttonRect.left + buttonRect.width / 2 - terminalRect.left) / terminalScale;
    const centerY = (buttonRect.top + buttonRect.height / 2 - terminalRect.top) / terminalScale;
    const burst = document.createElement("span");
    const flare = document.createElement("span");

    burst.className = "control-burst";
    burst.style.left = `${centerX}px`;
    burst.style.top = `${centerY}px`;
    buttonFxLayer.append(burst);

    flare.className = "control-flare";
    flare.style.left = `${centerX}px`;
    flare.style.top = `${centerY}px`;
    buttonFxLayer.append(flare);

    for (let index = 0; index < 6; index += 1) {
      const particle = document.createElement("i");
      const angle = index * 60 + (index % 2) * 8;
      const distance = 30 + (index % 3) * 12;

      particle.className = "control-particle";
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.setProperty("--particle-angle", `${angle}deg`);
      particle.style.setProperty("--particle-distance", `${distance}px`);
      particle.style.setProperty("--particle-delay", `${(index % 3) * 22}ms`);
      buttonFxLayer.append(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }

    burst.addEventListener("animationend", () => burst.remove(), { once: true });
    flare.addEventListener("animationend", () => flare.remove(), { once: true });
  }

  function animateSvgButton(button) {
    if (!button) return;
    const now = performance.now();
    const previousAnimation = lastButtonAnimation.get(button);
    if (previousAnimation !== undefined && now - previousAnimation < 160) return;
    lastButtonAnimation.set(button, now);
    button.classList.remove("is-pressed");
    void button.offsetWidth;
    button.classList.add("is-pressed");
    emitButtonFx(button);
    showControlNotification(button);
    window.clearTimeout(artReactionTimer);
    svgButtonsArt.classList.remove("is-reacting");
    void svgButtonsArt.offsetWidth;
    svgButtonsArt.classList.add("is-reacting");
    artReactionTimer = window.setTimeout(() => svgButtonsArt.classList.remove("is-reacting"), 700);
    window.setTimeout(() => button.classList.remove("is-pressed"), 620);
  }

  function updateSliderThumb(index, animate = true) {
    const selected = sliderNodes[index];
    if (!selected) return;

    if (!animate) {
      leftSlider.classList.add("is-dragging");
    }

    const nodeCenter = selected.offsetTop + selected.offsetHeight / 2;
    const percentage = (nodeCenter / leftSlider.clientHeight) * 100;
    leftSlider.style.setProperty("--thumb-y", `${percentage}%`);

    if (!animate) {
      requestAnimationFrame(() => leftSlider.classList.remove("is-dragging"));
    }
  }

  function setActiveNode(index, announce = true) {
    const next = Math.max(0, Math.min(sliderNodes.length - 1, index));
    const changed = next !== activeNode;
    if (changed) {
      pulseHaptic(9);
    }

    activeNode = next;
    sliderNodes.forEach((node, nodeIndex) => {
      const isActive = nodeIndex === activeNode;
      node.classList.toggle("is-active", isActive);
      node.setAttribute("aria-pressed", String(isActive));
    });

    updateSliderThumb(activeNode);
    if (changed || announce) {
      animateSvgButton(sliderNodes[activeNode]);
    }
    if (announce) {
      showToast(`${sliderNodes[activeNode].dataset.label} // LOCKED`);
    }
  }

  function closestNodeFromPointer(clientY) {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    sliderNodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function selectNodeFromPointer(event) {
    setActiveNode(closestNodeFromPointer(event.clientY), false);
  }

  function startSliderDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const previousNode = activeNode;
    draggingSlider = true;
    leftSlider.classList.add("is-dragging");
    leftSlider.setPointerCapture?.(event.pointerId);
    selectNodeFromPointer(event);
    if (previousNode === activeNode) {
      animateSvgButton(sliderNodes[activeNode]);
    }
    event.preventDefault();
  }

  function moveSlider(event) {
    if (!draggingSlider) return;
    selectNodeFromPointer(event);
    event.preventDefault();
  }

  function endSliderDrag(event) {
    if (!draggingSlider) return;
    draggingSlider = false;
    leftSlider.classList.remove("is-dragging");
    leftSlider.releasePointerCapture?.(event.pointerId);
    showToast(`${sliderNodes[activeNode].dataset.label} // LOCKED`);
    event.preventDefault();
  }

  function openSignalModal() {
    if (signalModal.classList.contains("is-open") || paymentFlow.classList.contains("is-open")) return;
    hideControlNotification();
    lastFocusedElement = document.activeElement;
    terminal.classList.add("is-obscured");
    signalModal.classList.add("is-open");
    signalModal.setAttribute("aria-hidden", "false");
    signalModal.inert = false;
    modalClose.focus({ preventScroll: true });
    pulseHaptic([18, 25, 18]);
    showToast("TRANSROLL SIGNAL // CONNECTED");
  }

  function closeSignalModal() {
    if (!signalModal.classList.contains("is-open")) return;
    signalModal.classList.remove("is-open");
    signalModal.setAttribute("aria-hidden", "true");
    signalModal.inert = true;
    if (!paymentFlow.classList.contains("is-open")) {
      terminal.classList.remove("is-obscured");
    }
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus({ preventScroll: true });
    }
    pulseHaptic(14);
  }

  function clearFingerprintTimers() {
    window.clearTimeout(fingerprintTimer);
    window.clearTimeout(fingerprintCompleteTimer);
    window.clearInterval(fingerprintInterval);
    fingerprintTimer = 0;
    fingerprintCompleteTimer = 0;
    fingerprintInterval = 0;
  }

  function clearPaymentCardSwipeStyles() {
    paymentCards.forEach((card) => {
      card.style.removeProperty("left");
      card.style.removeProperty("opacity");
      card.style.removeProperty("filter");
      card.style.removeProperty("transform");
      card.style.removeProperty("z-index");
    });
  }

  function resetPaymentCardSwipe() {
    if (paymentCardSwipe && paymentCardStack.hasPointerCapture?.(paymentCardSwipe.pointerId)) {
      paymentCardStack.releasePointerCapture(paymentCardSwipe.pointerId);
    }
    paymentCardSwipe = null;
    paymentCardStack.classList.remove("is-swiping");
    clearPaymentCardSwipeStyles();
  }

  function renderPaymentCardSwipe(viewportDeltaX) {
    const swipe = paymentCardSwipe;
    if (!swipe) return;

    const localDeltaX = viewportDeltaX * swipe.localScale;
    const progress = Math.min(1, Math.abs(viewportDeltaX) / (swipe.viewportWidth * 0.46));
    const direction = viewportDeltaX < 0 ? 1 : -1;
    const incomingIndex = (activePaymentCard + direction + paymentCards.length) % paymentCards.length;
    const activeCard = paymentCards[activePaymentCard];
    const incomingCard = paymentCards[incomingIndex];
    const activeRotation = (localDeltaX / paymentCardStack.clientWidth) * 9;
    const incomingStartLeft = direction > 0 ? 88 : 12;
    const incomingLeft = incomingStartLeft + (50 - incomingStartLeft) * progress;
    const incomingRotation = direction * 8 * (1 - progress);

    paymentCards.forEach((card) => {
      if (card === activeCard || card === incomingCard) return;
      card.style.removeProperty("left");
      card.style.removeProperty("opacity");
      card.style.removeProperty("filter");
      card.style.removeProperty("transform");
      card.style.removeProperty("z-index");
    });

    activeCard.style.left = "50%";
    activeCard.style.zIndex = "4";
    activeCard.style.opacity = String(1 - progress * 0.58);
    activeCard.style.filter = `saturate(${1 - progress * 0.34}) brightness(${1 - progress * 0.2})`;
    activeCard.style.transform =
      `translate(calc(-50% + ${localDeltaX}px), -50%) scale(${1 - progress * 0.12}) rotate(${activeRotation}deg)`;

    incomingCard.style.left = `${incomingLeft}%`;
    incomingCard.style.zIndex = "3";
    incomingCard.style.opacity = String(0.33 + progress * 0.67);
    incomingCard.style.filter =
      `saturate(${0.58 + progress * 0.42}) brightness(${0.72 + progress * 0.28})`;
    incomingCard.style.transform =
      `translate(-50%, -50%) scale(${0.62 + progress * 0.38}) rotate(${incomingRotation}deg)`;
  }

  function startPaymentCardSwipe(event) {
    if (paymentScreenName !== "cards" || paymentCardSwipe || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const bounds = paymentCardStack.getBoundingClientRect();
    if (!bounds.width) return;

    paymentCardSwipe = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      deltaX: 0,
      velocityX: 0,
      viewportWidth: bounds.width,
      localScale: paymentCardStack.clientWidth / bounds.width,
      axis: null,
      dragged: false,
    };
    paymentCardStack.setPointerCapture?.(event.pointerId);
  }

  function movePaymentCardSwipe(event) {
    const swipe = paymentCardSwipe;
    if (!swipe || event.pointerId !== swipe.pointerId) return;

    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;

    if (!swipe.axis) {
      if (Math.hypot(deltaX, deltaY) < 7) return;
      swipe.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }
    if (swipe.axis !== "horizontal") return;

    const elapsed = Math.max(1, event.timeStamp - swipe.lastTime);
    const instantaneousVelocity = (event.clientX - swipe.lastX) / elapsed;
    swipe.velocityX = swipe.velocityX * 0.68 + instantaneousVelocity * 0.32;
    swipe.lastX = event.clientX;
    swipe.lastTime = event.timeStamp;
    swipe.deltaX = deltaX;
    swipe.dragged = true;

    paymentCardStack.classList.add("is-swiping");
    renderPaymentCardSwipe(deltaX);
    event.preventDefault();
  }

  function endPaymentCardSwipe(event, cancelled = false) {
    const swipe = paymentCardSwipe;
    if (!swipe || event.pointerId !== swipe.pointerId) return;

    if (paymentCardStack.hasPointerCapture?.(event.pointerId)) {
      paymentCardStack.releasePointerCapture(event.pointerId);
    }

    const distanceThreshold = Math.min(72, Math.max(32, swipe.viewportWidth * 0.18));
    const isFastSwipe = Math.abs(swipe.deltaX) > 18 && Math.abs(swipe.velocityX) > 0.42;
    const shouldChange =
      !cancelled && swipe.axis === "horizontal" &&
      (Math.abs(swipe.deltaX) >= distanceThreshold || isFastSwipe);
    const direction = swipe.deltaX < 0 ? 1 : -1;

    paymentCardSwipe = null;
    paymentCardStack.classList.remove("is-swiping");
    if (shouldChange) {
      updatePaymentCard(activePaymentCard + direction);
    }
    clearPaymentCardSwipeStyles();

    if (swipe.dragged) {
      suppressPaymentCardClick = true;
      window.setTimeout(() => {
        suppressPaymentCardClick = false;
      }, 0);
    }
  }

  function updatePaymentCard(index, haptic = true) {
    const cardCount = paymentCards.length;
    activePaymentCard = (index + cardCount) % cardCount;

    paymentCards.forEach((card, cardIndex) => {
      const offset = (cardIndex - activePaymentCard + cardCount) % cardCount;
      card.classList.toggle("is-active", offset === 0);
      card.classList.toggle("is-next", offset === 1);
      card.classList.toggle("is-prev", offset === cardCount - 1);
      card.setAttribute("aria-pressed", String(offset === 0));
      card.querySelector("img").alt = offset === 0 ? `Currency Card ${paymentPlans[cardIndex].name}` : "";
    });

    paymentDots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activePaymentCard);
    });

    const plan = paymentPlans[activePaymentCard];
    paymentPlanName.textContent = plan.name;
    paymentPlanCredit.textContent = plan.credit;
    paymentTotal.textContent = plan.total;
    paymentReceiptTotal.textContent = plan.total;

    if (haptic) pulseHaptic(8);
  }

  function updatePaymentPin() {
    paymentPinDots.forEach((dot, index) => {
      dot.classList.toggle("is-filled", index < paymentPin.length);
    });
    paymentPinDisplay.setAttribute(
      "aria-label",
      paymentPin.length ? `PIN con ${paymentPin.length} de 4 cifras` : "PIN vacío",
    );
    paymentPinConfirm.disabled = paymentPin.length !== 4;
  }

  function focusPaymentScreen(screenName) {
    const focusTargets = {
      cards: paymentCardConfirm,
      pin: paymentKeyButtons[0],
      fingerprint: paymentFingerprint,
      success: paymentClose,
    };
    requestAnimationFrame(() => focusTargets[screenName]?.focus({ preventScroll: true }));
  }

  function showPaymentScreen(screenName, focus = true) {
    const activeIndex = paymentScreenOrder.indexOf(screenName);
    paymentScreenName = screenName;

    paymentScreens.forEach((screen) => {
      const isActive = screen.dataset.paymentScreen === screenName;
      screen.hidden = !isActive;
      screen.classList.toggle("is-active", isActive);
    });

    paymentSteps.forEach((step) => {
      const stepIndex = paymentScreenOrder.indexOf(step.dataset.paymentStep);
      step.classList.toggle("is-active", stepIndex === activeIndex);
      step.classList.toggle("is-complete", stepIndex < activeIndex);
    });

    if (focus) focusPaymentScreen(screenName);
  }

  function resetPaymentFlow() {
    window.clearTimeout(paymentCloseTimer);
    clearFingerprintTimers();
    resetPaymentCardSwipe();
    paymentPin = "";
    paymentFingerprint.disabled = false;
    paymentFingerprint.classList.remove("is-scanning", "is-verified");
    paymentFingerprintStatus.textContent = "TOUCH TO SCAN";
    paymentMatchRate.textContent = "00.00%";
    updatePaymentPin();
    updatePaymentCard(0, false);
    showPaymentScreen("cards", false);
  }

  function openPaymentFlow(trigger) {
    if (paymentFlow.classList.contains("is-open")) return;
    hideControlNotification();
    window.clearTimeout(toastTimer);
    toast.classList.remove("is-visible");
    lastPaymentFocusedElement = trigger || document.activeElement;
    resetPaymentFlow();
    terminal.classList.add("is-obscured");
    paymentFlow.classList.add("is-open");
    paymentFlow.setAttribute("aria-hidden", "false");
    paymentFlow.inert = false;
    focusPaymentScreen("cards");
    pulseHaptic([15, 30, 15]);
  }

  function closePaymentFlow() {
    if (!paymentFlow.classList.contains("is-open")) return;
    window.clearTimeout(paymentCloseTimer);
    clearFingerprintTimers();
    paymentFlow.classList.remove("is-open");
    paymentFlow.setAttribute("aria-hidden", "true");
    paymentFlow.inert = true;
    terminal.classList.remove("is-obscured");
    utilityButtons.forEach((item) => item.classList.remove("is-active"));
    if (lastPaymentFocusedElement instanceof HTMLElement) {
      lastPaymentFocusedElement.focus({ preventScroll: true });
    }
    pulseHaptic(12);
  }

  function handlePaymentKey(key, button) {
    if (paymentScreenName !== "pin") return;

    if (/^\d$/.test(key) && paymentPin.length < 4) {
      paymentPin += key;
    } else if (key === "backspace") {
      paymentPin = paymentPin.slice(0, -1);
    } else if (key === "clear") {
      paymentPin = "";
    } else {
      return;
    }

    if (button) {
      button.classList.add("is-pressed");
      window.setTimeout(() => button.classList.remove("is-pressed"), 180);
    }
    updatePaymentPin();
    pulseHaptic(paymentPin.length === 4 ? [9, 18, 9] : 7);
  }

  function completePayment() {
    const sequence = String(Date.now()).slice(-6);
    paymentTransaction.textContent = `EZ-${sequence}`;
    paymentReceiptTotal.textContent = paymentPlans[activePaymentCard].total;
    showPaymentScreen("success");
    pulseHaptic([18, 35, 18, 35, 32]);
    paymentCloseTimer = window.setTimeout(closePaymentFlow, 2800);
  }

  function scanPaymentFingerprint() {
    if (paymentScreenName !== "fingerprint" || paymentFingerprint.classList.contains("is-scanning")) return;

    clearFingerprintTimers();
    paymentFingerprint.disabled = true;
    paymentFingerprint.classList.remove("is-verified");
    paymentFingerprint.classList.add("is-scanning");
    paymentFingerprintStatus.textContent = "SCANNING BIOMETRICS";
    paymentMatchRate.textContent = "08.40%";
    let matchRate = 8.4;

    fingerprintInterval = window.setInterval(() => {
      matchRate = Math.min(97.6, matchRate + 5.6);
      paymentMatchRate.textContent = `${matchRate.toFixed(2)}%`;
    }, 90);

    fingerprintTimer = window.setTimeout(() => {
      window.clearInterval(fingerprintInterval);
      fingerprintInterval = 0;
      paymentFingerprint.classList.remove("is-scanning");
      paymentFingerprint.classList.add("is-verified");
      paymentFingerprintStatus.textContent = "IDENTITY VERIFIED";
      paymentMatchRate.textContent = "99.98%";
      pulseHaptic([14, 24, 28]);
      fingerprintCompleteTimer = window.setTimeout(completePayment, 650);
    }, 1600);
  }

  function selectAction(button) {
    actionButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    animateSvgButton(button);
    pulseHaptic(11);
    showToast(`${button.dataset.action} // ACTIVE`);
  }

  function activateUtility(button) {
    utilityButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    animateSvgButton(button);
    openPaymentFlow(button);
  }

  function activateIndicator() {
    animateSvgButton(indicatorButton);
    pulseHaptic([12, 28, 12]);
    showToast("SYSTEM CORE // PULSE");
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function requestFullscreen() {
    const target = document.documentElement;
    try {
      if (target.requestFullscreen) {
        fullscreenRequest = target.requestFullscreen({ navigationUI: "hide" });
      } else if (target.webkitRequestFullscreen) {
        fullscreenRequest = target.webkitRequestFullscreen();
      }
    } catch {
      fullscreenRequest = null;
      showToast("FULLSCREEN // UNAVAILABLE");
    }

    if (fullscreenRequest?.catch) {
      fullscreenRequest.catch(() => showToast("FULLSCREEN // BLOCKED"));
    }
    return fullscreenRequest;
  }

  function exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        return document.exitFullscreen();
      }
      if (document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
      }
    } catch {
      showToast("EXIT // UNAVAILABLE");
    }
    return null;
  }

  function handleFullscreenHotspot(event) {
    const now = performance.now();
    const isDoubleTap = now - lastFullscreenTap < 420;
    lastFullscreenTap = isDoubleTap ? 0 : now;

    if (isDoubleTap) {
      const exit = () => {
        if (fullscreenElement()) {
          exitFullscreen();
        }
      };

      if (fullscreenRequest?.finally) {
        fullscreenRequest.finally(exit);
      } else {
        exit();
      }
      pulseHaptic([15, 35, 15]);
      event.preventDefault();
      return;
    }

    if (!fullscreenElement()) {
      requestFullscreen();
      pulseHaptic(14);
    }
    event.preventDefault();
  }

  function startPlayback() {
    const playMain = mainVideo.play();
    playMain?.catch?.(() => {});
  }

  function trapModalFocus(event) {
    if (event.key !== "Tab") return;
    const activeDialog = paymentFlow.classList.contains("is-open")
      ? paymentFlow
      : signalModal.classList.contains("is-open")
        ? signalModal
        : null;
    if (!activeDialog) return;

    const focusableElements = [...activeDialog.querySelectorAll("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")]
      .filter((element) => element instanceof HTMLElement && element.offsetParent !== null);
    if (!focusableElements.length) return;

    const first = focusableElements[0];
    const last = focusableElements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  sliderNodes.forEach((node, index) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      setActiveNode(index);
    });

    node.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = Math.min(sliderNodes.length - 1, index + 1);
        setActiveNode(next);
        sliderNodes[next].focus();
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const previous = Math.max(0, index - 1);
        setActiveNode(previous);
        sliderNodes[previous].focus();
      }
    });
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectAction(button);
    });
  });

  utilityButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      activateUtility(button);
    });
  });

  paymentCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (suppressPaymentCardClick) {
        event.preventDefault();
        return;
      }
      updatePaymentCard(Number(card.dataset.paymentCard));
    });
  });

  paymentCardStack.addEventListener("pointerdown", startPaymentCardSwipe);
  paymentCardStack.addEventListener("pointermove", movePaymentCardSwipe);
  paymentCardStack.addEventListener("pointerup", endPaymentCardSwipe);
  paymentCardStack.addEventListener("pointercancel", (event) => endPaymentCardSwipe(event, true));
  paymentPrev.addEventListener("click", () => updatePaymentCard(activePaymentCard - 1));
  paymentNext.addEventListener("click", () => updatePaymentCard(activePaymentCard + 1));
  paymentCardConfirm.addEventListener("click", () => {
    showPaymentScreen("pin");
    pulseHaptic(10);
  });
  paymentKeyButtons.forEach((button) => {
    button.addEventListener("click", () => handlePaymentKey(button.dataset.paymentKey, button));
  });
  paymentPinConfirm.addEventListener("click", () => {
    if (paymentPin.length !== 4) return;
    showPaymentScreen("fingerprint");
    pulseHaptic([10, 20, 10]);
  });
  paymentFingerprint.addEventListener("click", scanPaymentFingerprint);
  paymentClose.addEventListener("click", closePaymentFlow);

  indicatorButton.addEventListener("click", (event) => {
    event.stopPropagation();
    activateIndicator();
  });

  leftSlider.addEventListener("pointerdown", startSliderDrag);
  leftSlider.addEventListener("pointermove", moveSlider);
  leftSlider.addEventListener("pointerup", endSliderDrag);
  leftSlider.addEventListener("pointercancel", endSliderDrag);
  videoTrigger.addEventListener("click", openSignalModal);
  modalClose.addEventListener("click", closeSignalModal);
  fullscreenHotspot.addEventListener("pointerup", handleFullscreenHotspot);
  window.addEventListener("resize", fitStage, { passive: true });

  document.addEventListener("fullscreenchange", () => {
    showToast(fullscreenElement() ? "FULLSCREEN // ACTIVE" : "FULLSCREEN // EXIT");
  });
  document.addEventListener("webkitfullscreenchange", () => {
    showToast(fullscreenElement() ? "FULLSCREEN // ACTIVE" : "FULLSCREEN // EXIT");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (paymentFlow.classList.contains("is-open")) {
        closePaymentFlow();
      } else {
        closeSignalModal();
      }
    }

    if (paymentFlow.classList.contains("is-open")) {
      if (paymentScreenName === "cards" && event.key === "ArrowLeft") {
        event.preventDefault();
        updatePaymentCard(activePaymentCard - 1);
      } else if (paymentScreenName === "cards" && event.key === "ArrowRight") {
        event.preventDefault();
        updatePaymentCard(activePaymentCard + 1);
      } else if (paymentScreenName === "pin" && /^\d$/.test(event.key)) {
        event.preventDefault();
        handlePaymentKey(event.key);
      } else if (paymentScreenName === "pin" && event.key === "Backspace") {
        event.preventDefault();
        handlePaymentKey("backspace");
      } else if (paymentScreenName === "pin" && event.key === "Delete") {
        event.preventDefault();
        handlePaymentKey("clear");
      } else if (paymentScreenName === "pin" && event.key === "Enter" && paymentPin.length === 4) {
        event.preventDefault();
        showPaymentScreen("fingerprint");
      }
    }

    if (
      event.key.toLowerCase() === "f" &&
      !signalModal.classList.contains("is-open") &&
      !paymentFlow.classList.contains("is-open")
    ) {
      if (fullscreenElement()) {
        exitFullscreen();
      } else {
        requestFullscreen();
      }
    }
    trapModalFocus(event);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) startPlayback();
  });

  fitStage();
  startPlayback();
  requestAnimationFrame(() => updateSliderThumb(activeNode, false));
})();
