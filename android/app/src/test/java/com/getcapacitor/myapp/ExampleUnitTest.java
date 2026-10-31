package com.bahaicalendar.app;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ExampleUnitTest {

    @Test
    public void calculateBottomObstructionReturnsZeroWhenNavigationHidden() {
        assertEquals(0, AndroidNavigationInsetsPlugin.calculateBottomObstruction(51, 51, false, false));
    }

    @Test
    public void calculateBottomObstructionReturnsZeroWhenKeyboardVisible() {
        assertEquals(0, AndroidNavigationInsetsPlugin.calculateBottomObstruction(51, 51, true, true));
    }

    @Test
    public void calculateBottomObstructionReturnsZeroForGestureNavigation() {
        assertEquals(0, AndroidNavigationInsetsPlugin.calculateBottomObstruction(51, 0, true, false));
    }

    @Test
    public void overlappingObstructionReturnsZeroWhenWebViewEndsBeforeNavigationArea() {
        assertEquals(0, AndroidNavigationInsetsPlugin.calculateOverlappingBottomObstruction(51, 0, 845, 896));
    }

    @Test
    public void overlappingObstructionReturnsRawWhenWebViewExtendsUnderNavigationArea() {
        assertEquals(51, AndroidNavigationInsetsPlugin.calculateOverlappingBottomObstruction(51, 0, 896, 896));
    }

    @Test
    public void overlappingObstructionReturnsPartialWhenWebViewPartiallyOverlaps() {
        assertEquals(15, AndroidNavigationInsetsPlugin.calculateOverlappingBottomObstruction(51, 0, 860, 896));
    }

    @Test
    public void overlappingObstructionFallsBackToRawForInvalidGeometry() {
        assertEquals(51, AndroidNavigationInsetsPlugin.calculateOverlappingBottomObstruction(51, 100, 100, 896));
    }
}
