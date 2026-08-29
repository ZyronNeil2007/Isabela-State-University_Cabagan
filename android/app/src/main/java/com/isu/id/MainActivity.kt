package com.isu.id

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.isu.id.data.model.CampusTheme
import com.isu.id.ui.theme.ISUIDTheme
import com.isu.id.ui.web.WebIdScreen

/**
 * Main (and only) Activity — Hybrid WebView shell mode.
 *
 * Loads the web app (index.html / style.css / app.js) from
 * app/src/main/assets/www/ via a hardware-accelerated WebView,
 * achieving 100% visual parity with the browser version.
 *
 * A JS bridge (WebBridge) exposes native Android capabilities
 * (gallery picker, MediaStore save, PDF share sheet) back to the
 * web app so download/upload flows work natively.
 *
 * To revert to the Compose wizard, swap WebIdScreen() back to:
 *   private val viewModel: WizardViewModel by viewModels { ... }
 *   WizardScreen(viewModel = viewModel)
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            // Use default Cabagan theme for system bar colouring
            ISUIDTheme(campusTheme = CampusTheme.CABAGAN) {
                WebIdScreen()
            }
        }
    }
}

